angular.module('tasklist', ['ionic'])

    /**
     * Stores and retrieves a JSON object from the server
     */
    .value('serverEndpoint', 'https://7ycx0a0fkd.execute-api.us-west-2.amazonaws.com/prod/projectlist')
    .factory('PersistenceService', function (serverEndpoint, $http) {
        return {
            loadFromServer: function () {
                return $http.get(serverEndpoint);
            },
            updateServerData: function (content) {
                console.log("Sending content: " + content);
                return $http.post(
                    serverEndpoint,
                    {
                        content: content
                    }
                );
            }
        };
    })

    /**
     * Creates Task objects
     */
    .factory('TaskFactory', function(){
        return {
            newTask: function(task){
                return {
                    title: task.title,
                    importance: task.importance,
                    time: task.time,
                    active: task.active
                };
            },
            newEmptyTask: function(task){
                task.active = false;
                return this.newTask(task);
            },
            taskFromJson: function(jsonTask){
                return this.newTask(jsonTask);
            }
        }
    })

    /**
     * Creates Project objects
     */
    .factory('ProjectFactory', ['TaskFactory', function(TaskFactory){
        return {
            newProject: function(projectTitle, tasks){
                return {
                    title: projectTitle,
                    tasks: tasks,
                    addNewTask: function(task){
                        this.tasks.push(TaskFactory.newEmptyTask(task));
                    },
                    removeTask: function(task){
                        var index = this.tasks.indexOf(task);
                        this.tasks.splice(index, 1);
                    }
                };
            },
            newEmptyProject: function(projectTitle) {
                return this.newProject(projectTitle, []);
            },
            projectFromJson: function(project){
                var tasks = [];
                project.tasks.forEach(function(element){
                    tasks.push(TaskFactory.taskFromJson(element));
                });

                return this.newProject(project.title, tasks);
            }
        }
    }])

    /**
     * Keeps and synchronizes the list of projects with their tasks, as well as the currently active project
     */
    .factory('ProjectList', function(PersistenceService, ProjectFactory, $ionicLoading){
        var projects = [];
        var activeProject = {};

        var projectList = {
            getProjects: function(){
                return projects;
            },
            getActiveProject: function(){
                return activeProject;
            },
            setActiveProject: function(project){
                activeProject = project;
            },
            setProjectsFromJson: function(jsonProjects){
                projects = [];
                jsonProjects.forEach(function(e){
                    projects.push(ProjectFactory.projectFromJson(e));
                });
            },
            refreshProjects: function (additionalActionsOnSuccess) {
                PersistenceService.loadFromServer().success(
                    function (value) {
                        projectList.setProjectsFromJson(angular.fromJson(value));
                        activeProject = projects[0];
                        console.log(value);
                        if(additionalActionsOnSuccess){
                            additionalActionsOnSuccess();
                        }
                    }).error(function (error) {
                    alert(error);
                })
            },
            updateProjects: function () {
                PersistenceService.updateServerData(angular.toJson(projects))
                    .success(function(){
                        $ionicLoading.show({ template: 'Content synchronized!', noBackdrop: true, duration: 2000 });
                    });
            },
            addNewProject: function (projectTitle) {
                var newProject = ProjectFactory.newEmptyProject(projectTitle);
                projects.push(newProject);
                activeProject = newProject;
                projectList.updateProjects();
            },
            removeTask: function(task){
                activeProject.removeTask(task);
                projectList.updateProjects();
            },
            removeProject: function(project){
                var index = projects.indexOf(project);
                projects.splice(index, 1);
                console.log(angular.toJson(projects));
                projectList.updateProjects();
            }
        };
        projectList.refreshProjects();
        return projectList;
    })

    /**
     * Controller for the displayed task list
     */
    .controller('TaskListCtrl', function ($scope, ProjectList, $ionicSideMenuDelegate) {

        $scope.getProjects = ProjectList.getProjects;
        $scope.getActiveProject = ProjectList.getActiveProject;

        $scope.onChangeTaskActive = ProjectList.updateProjects;

        $scope.toggleProjects = function () {
            $ionicSideMenuDelegate.toggleRight();
        };

        $scope.refreshTaskList = function () {
            ProjectList.refreshProjects(function() {
                $scope.$broadcast('scroll.refreshComplete');
            });
        };

        $scope.onSwipeRightTaskItem = function(task) {
            ProjectList.removeTask(task);
        };

        $scope.range = function(num){
            var x=new Array(); for(var i=0;i<num;i++){ x.push(i+1); } return x;
        };
    })

    /**
     * Controller for the project selection and creation panel
     */
    .controller('SelectProjectCtrl', function($scope, $ionicSideMenuDelegate, ProjectList){
        // Called to create a new project
        $scope.newProject = function () {
            var projectTitle = prompt('Project name');
            if (projectTitle) {
                ProjectList.addNewProject(projectTitle);
                $ionicSideMenuDelegate.toggleRight(false);
            }
        };

        $scope.selectProject = function(project){
            ProjectList.setActiveProject(project);
            $ionicSideMenuDelegate.toggleRight(false);
        };

        $scope.onSwipeRightProjectItem = function(project){
            console.log("Swiped!!");
            ProjectList.removeProject(project);
        }
    })

    /**
     * Controller for the task creation modal
     */
    .controller('NewTaskModalCtrl', function(ProjectList, $scope, $ionicModal){
        $scope.createTaskModalFunctions = {
            initialize: function() {
                $scope.newTask = {title: "", importance: 3, time: 3};

                // Create our modal
                $ionicModal.fromTemplateUrl('new-task.html', function (modal) {
                    $scope.taskModal = modal;
                }, {
                    scope: $scope
                });
            },

            submit: function () {
                ProjectList.getActiveProject().addNewTask($scope.newTask);
                ProjectList.updateProjects();

                $scope.taskModal.hide();
                $scope.newTask.title = "";
                $scope.newTask.importance = 3;
                $scope.newTask.time = 3;
            },

            openModal: function () {
                $scope.taskModal.show();
            },

            hideModal: function () {
                $scope.taskModal.hide();
            }
        };
        $scope.createTaskModalFunctions.initialize();
    });


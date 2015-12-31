angular.module('tasklist', ['ionic'])


    .value('serverEndpoint', 'https://7ycx0a0fkd.execute-api.us-west-2.amazonaws.com/prod/projectlist')

    .factory('ProjectsService', ['serverEndpoint', function (serverEndpoint, $http) {
        return {
            loadFromServer: function () {
                return $http.get(serverEndpoint);
            },
            updateServerData: function (projects) {
                return $http.post(
                    serverEndpoint,
                    {
                        content: angular.toJson(projects)
                    }
                );
            }
        };
    }])

    .factory('Projects', ['ProjectsServer', function(projectsServer){
        var projects = [];
        var activeProject = 0;

        var projectsFactory;
        projectsFactory = {
            getProjects: function () {
                return projects;
            },
            refreshProjects: function () {
                projectsServer.loadFromServer.success(
                    function (value) {
                        console.log("**" + value);
                        projects = angular.fromJson(value);
                        activeProject = projects[0];
                        console.log(projects);
                        //additionalSuccess();
                    }).error(function (error) {
                    alert(error);
                })
            },
            updateProjects: function () {
                projectsServer.updateServerData(projects);
            },
            addNewProject: function (projectTitle) {
                var newProject = {
                    title: projectTitle,
                    tasks: []
                }
                projects.push(newProject);
                projectsFactory.updateProjects();
            }
        };
        projectsFactory.refreshProjects();
        return projectsFactory;
    }])

    /**
     * The Projects factory handles saving and loading projects
     * from local storage, and also lets us save and load the
     * last active project index.
     */
    .factory('Projects', function ($q, $http) {
        return {
            loadFromServer: function () {
                return $http.get('https://7ycx0a0fkd.execute-api.us-west-2.amazonaws.com/prod/projectlist');
            },
            updateServerData: function (projects) {
                console.log({
                    content: angular.toJson(projects)
                });
                $http.post(
                    'https://7ycx0a0fkd.execute-api.us-west-2.amazonaws.com/prod/projectlist',
                    {content: angular.toJson(projects)}
                ).then(function (value) {
                    console.log("Saved into server");
                }, function (error) {
                    alert("Error saving into server: " + error);
                    console.log(error);
                });
            },
            newProject: function (projectTitle) {
                // Add a new project
                return {
                    title: projectTitle,
                    tasks: []
                };
            },
        }
    })

    .controller('TaskListCtrl', function ($scope, $timeout, $ionicModal, Projects, $ionicSideMenuDelegate) {

        // A utility function for creating a new project
        // with the given projectTitle
        var createProject = function (projectTitle) {
            var newProject = Projects.newProject(projectTitle);
            $scope.projects.push(newProject);
            Projects.updateServerData($scope.projects);
            $scope.selectProject(newProject, $scope.projects.length - 1);
        }


        var checkShouldCreateInitialProject = function () {
            if ($scope.projects.length == 0) {
                while (true) {
                    var projectTitle = prompt('Your first project title:');
                    if (projectTitle) {
                        createProject(projectTitle);
                        break;
                    }
                }
            }
        };

        var loadProjectsFromServer = function (additionalSuccess) {
            // Load or initialize projects
            Projects.loadFromServer().success(
                function (value) {
                    console.log("**" + value);
                    $scope.projects = angular.fromJson(value);
                    $scope.activeProject = $scope.projects[0];
                    console.log($scope.projects);
                    additionalSuccess();
                }).error(function (error) {
                alert(error);
            });
        };

        loadProjectsFromServer(checkShouldCreateInitialProject);

        // Called to create a new project
        $scope.newProject = function () {
            var projectTitle = prompt('Project name');
            if (projectTitle) {
                createProject(projectTitle);
            }
        };

        // Called to select the given project
        $scope.selectProject = function (project, index) {
            $scope.activeProject = project;
            Projects.setLastActiveIndex(index);
            $ionicSideMenuDelegate.toggleRight(false);
        };

        // Create our modal
        $ionicModal.fromTemplateUrl('new-task.html', function (modal) {
            $scope.taskModal = modal;
        }, {
            scope: $scope
        });

        $scope.updateServerData = function () {
            Projects.updateServerData($scope.projects);
        };

        $scope.createTask = function (task) {
            if (!$scope.activeProject || !task) {
                return;
            }
            $scope.activeProject.tasks.push({
                title: task.title,
                active: false
            });
            $scope.taskModal.hide();

            $scope.updateServerData();

            task.title = "";
        };

        $scope.newTask = function () {
            $scope.taskModal.show();
        };

        $scope.closeNewTask = function () {
            $scope.taskModal.hide();
        }

        $scope.toggleProjects = function () {
            $ionicSideMenuDelegate.toggleRight();
        };


        $scope.completeTask = function (task) {
            var index = $scope.activeProject.tasks.indexOf(task);
            $scope.activeProject.tasks.splice(index, 1);
            Projects.updateServerData($scope.projects);
        };

        $scope.refreshTaskList = function () {
            loadProjectsFromServer(function () {
                $scope.$broadcast('scroll.refreshComplete');
            });
        };
    });


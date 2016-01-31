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
     * Keeps and synchronizes the list of tasks
     */
    .factory('TaskList', function(PersistenceService, TaskFactory, $ionicLoading){
        var tasks = [];

        var taskList = {
            getTasks: function(){
                return tasks;
            },
            setTasksFromJson: function(jsonTasks){
                tasks = [];
                jsonTasks.forEach(function(e){
                    tasks.push(TaskFactory.taskFromJson(e));
                });
            },
            refreshTasks: function (additionalActionsOnSuccess) {
                PersistenceService.loadFromServer().success(
                    function (value) {
                        taskList.setTasksFromJson(angular.fromJson(value));
                        console.log(value);
                        if(additionalActionsOnSuccess){
                            additionalActionsOnSuccess();
                        }
                    }).error(function (error) {
                    alert(error);
                })
            },
            updateTasks: function () {
                PersistenceService.updateServerData(angular.toJson(tasks))
                    .success(function(){
                        $ionicLoading.show({ template: 'Content synchronized!', noBackdrop: true, duration: 2000 });
                    });
            },
            removeTask: function(task){
                var index = tasks.indexOf(task);
                tasks.splice(index, 1);
                taskList.updateTasks();
            },
            addNewTask: function(task){
                tasks.push(TaskFactory.newEmptyTask(task));
                taskList.updateTasks();
            },
        };
        taskList.refreshTasks();
        return taskList;
    })

    /**
     * Controller for the displayed task list
     */
    .controller('TaskListCtrl', function ($scope, TaskList, $ionicSideMenuDelegate) {

        $scope.getTasks = TaskList.getTasks;

        $scope.onChangeTaskActive = TaskList.updateTasks;

        $scope.refreshTaskList = function () {
            TaskList.refreshTasks(function() {
                $scope.$broadcast('scroll.refreshComplete');
            });
        };

        $scope.onSwipeRightTaskItem = function(task) {
            TaskList.removeTask(task);
        };

        $scope.range = function(num){
            var x=new Array(); for(var i=0;i<num;i++){ x.push(i+1); } return x;
        };
    })

    /**
     * Controller for the task creation modal
     */
    .controller('NewTaskModalCtrl', function(TaskList, $scope, $ionicModal){
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
                TaskList.addNewTask($scope.newTask);

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


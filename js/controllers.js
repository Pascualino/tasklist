angular.module('tasklist.controllers', ['tasklist.controllers.model', 'tasklist.controllers.algorithms'])

    /**
     * Controller for the displayed task list
     */
    .controller('TaskListCtrl', function ($scope, TaskList, $ionicSideMenuDelegate) {

        $scope.getTasks = TaskList.getTasks;
        $scope.getPrioritizedTasks = TaskList.getPrioritizedTasks;

        $scope.onChangeTaskCompleted = TaskList.updateTasks;

        $scope.refreshTaskList = function () {
            TaskList.refreshTasks(function() {
                $scope.$broadcast('scroll.refreshComplete');
            });
        };

        $scope.onSwipeRightTaskItem = function(task) {
            task.completed = true;
            TaskList.updateTasks();
        };

        $scope.onSwipeLeftTaskItem = function(task) {
            task.completed = false;
            TaskList.updateTasks();
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
                $ionicModal.fromTemplateUrl('templates/modal-addtask.html', function (modal) {
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
    })

    .controller('EditTaskCtrl', function(TaskList, $stateParams, $scope, $location){
        $scope.task = TaskList.getTask($stateParams.taskId).clone();

        $scope.submit = function() {
            TaskList.updateTask($stateParams.taskId, $scope.task);
            $location.path("tasklist");
        }
    });

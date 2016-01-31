angular.module('tasklist.controllers.model', [])

    /**
     * Creates Task objects
     */
    .factory('TaskFactory', function(){
        var taskFactory = {
            newTask: function(task){
                return {
                    title: task.title,
                    description: task.description,
                    importance: task.importance,
                    time: task.time,
                    completed: task.completed,
                    clone: function(){
                        return taskFactory.newTask(this);
                    }
                };
            },
            newEmptyTask: function(task){
                task.completed = false;
                return this.newTask(task);
            },
            taskFromJson: function(jsonTask){
                return this.newTask(jsonTask);
            }
        };
        return taskFactory;
    })

    /**
     * Keeps and synchronizes the list of tasks
     */
    .factory('TaskList', function(PersistenceService, TaskFactory, $ionicLoading, TaskSortingAlgorithm){
        var tasks = [];
        var prioritizedTasks = [];

        var taskList = {
            getTasks: function(){
                return tasks;
            },
            getTask: function(index){
                return tasks[index];
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
                        prioritizedTasks = taskList.prioritizeTasks();
                        console.log(value);
                        if(additionalActionsOnSuccess){
                            additionalActionsOnSuccess();
                        }
                    }).error(function (error) {
                        alert(error);
                    }
                )
            },
            prioritizeTasks: function(){
                tasks = TaskSortingAlgorithm.sortTasks(taskList.getTasks());
                var maxPoints = 10;
                var index = 0;
                var points = 0;
                while(index < tasks.length && points + tasks[index].time < maxPoints){
                    points += tasks[index].time;
                    index++;
                }
                return {
                    today: tasks.slice(0, index),
                    upcoming: tasks.slice(index, tasks.length)
                }
            },
            updateTask: function(index, task){
                tasks[index] = task;
                taskList.updateTasks();
            },
            updateTasks: function () {
                prioritizedTasks = taskList.prioritizeTasks();
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
            getPrioritizedTasks: function(){
                return prioritizedTasks;
            }
        };
        taskList.refreshTasks();
        return taskList;
    })

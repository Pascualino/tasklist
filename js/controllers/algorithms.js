angular.module('tasklist.controllers.algorithms', [])

    .factory('TaskSortingAlgorithm', function () {
        var comparisonFunction = function(task1, task2){
            return task1.importance / task1.time <= task2.importance / task2.time;
        };

        return {
            sortTasks : function(tasks) {
                var sortedTasks = [];
                tasks.forEach(
                    function(task) {
                        sortedTasks.push(task.clone())
                    }
                );

                sortedTasks.sort(comparisonFunction);
                return sortedTasks;
            }
        };
    });

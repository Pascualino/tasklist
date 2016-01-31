angular.module('tasklist.services', [])

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

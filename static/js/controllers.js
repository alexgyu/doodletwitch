var app = angular.module('MyApp', ['ngMaterial']);

app.config(function ($locationProvider) {
    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');
});



app.controller('AppCtrl', function ($scope, $http, $location) {

    $scope.streamsLoaded = false;

    $http.jsonp("https://api.twitch.tv/kraken/streams/featured?limit=20&callback=JSON_CALLBACK").
    success(function (data, status, headers, config) {
        $scope.streamList = data.featured;
        $scope.streamsLoaded = true;
    }).
    error(function (data, status, headers, config) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
    });

    $scope.doodleStream = function (stream) {
        
        //i just wanna change the page man
        window.location.href=$location.absUrl()+stream;
    }

});
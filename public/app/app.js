angular.module('app', ['ngResource', 'ngRoute']);

angular.module('app').config(function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
    $routeProvider
        .when('/', {templateUrl:'/partials/matrix', controller: 'mainCtrl'});
});

angular.module('app').controller('mainCtrl', function($scope, $window){
    var c = $window.numeric.add([7,8,9],[10,1,2])
    console.log(c);
    $scope.myVar = c;


});
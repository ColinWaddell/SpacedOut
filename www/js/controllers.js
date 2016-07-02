angular.module('app.controllers', [])

.controller('settingsCtrl', function($scope) {

})

.controller('spacedOutAddCtrl', function($scope, $state, Roster) {
  var userDefault = {'name': "", 'type': 'Staff', 'signed_in': false};

  $scope.userAddSuccess = function(data){
    $scope.user = userDefault;
    $state
      .go('tabsController.spacedOut');
  };

  $scope.userAddError = function(){
    console.log('userAddError');
  };

  $scope.rosterAdd = function(){
    if ($scope.user.name.lengh < 2)
      return;

    Roster
      .add($scope.user)
      .then(
        $scope.userAddSuccess,
        $scope.userAddError
      );
  }

  $scope.user = userDefault;
})

.controller('spacedOutCtrl', function($scope, Roster) {
  $scope.roster = {'entries': []};

  $scope.firstLetter = function(name) {
    if (name === undefined)
      return;

    return name.toUpperCase() && name.toUpperCase().charAt(0);
  }

  $scope.toggleStatus = function(user){
    Roster.setStatus(user.id, user.signed_in);
    user.last_activity = Date().toLocaleString();
  }

  $scope.rosterPopulate = function(data){
      $scope.roster.entries = data;
  }

  $scope.rosterError = function (){
    var alertPopup = $ionicPopup.alert({
      title: 'Roster Error',
      template: 'Sorry - Try restarting the app.',
      okText: 'Apology Accepted'
    });
  }

  $scope.rosterReload = function(){
    $scope.roster =
      Roster
        .all()
        .then(
          $scope.rosterPopulate,
          $scope.rosterError
        );
    }

    Roster.registerObserverCallback($scope.rosterReload);

    $scope.rosterReload();
})

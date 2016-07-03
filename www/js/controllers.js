angular.module('app.controllers', [])

.controller('settingsCtrl', function($scope, Roster) {
  $scope.Nuke = function(){
    Roster.deleteAll();
  }
})

.controller('spacedOutAddCtrl', function($scope, $state, Roster) {
  var userDefault = {'name': "", 'type': 'staff', 'status': 'out'};

  $scope.userAddSuccess = function(data){
    $scope.user.name = "";
    $scope.user.type = 'staff';
    $scope.user.status = 'out';
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

.controller('spacedOutCtrl', function($scope, $filter, Roster) {
  $scope.roster = {'entries': []};
  $scope.interface = {
    'status': 'all',
    'type': 'all',
    'multiselect': false
  }

  $scope.multiselectCancel = function(){
    $scope.interface.multiselect = false;
    $scope.roster.entries.forEach(
      function(entry){
        entry.selected = false;
      }
    );
  }

  $scope.filterStatus = function(status){
    $scope.interface.status = status;
  }

  $scope.firstLetter = function(name) {
    if (name === undefined)
      return;

    return name.toUpperCase() && name.toUpperCase().charAt(0);
  }

  $scope.filterEntries = function(entries, status, type){
    fe = [];
    entries.forEach(function(entry){
      if(status==='all' || status==entry.status)
        if(type==='all' || type==entry.type)
          fe.push(entry);
    });

    return fe;
  }

  $scope.toggleStatus = function(user){
    if($scope.interface.multiselect){
      $scope.roster.entries.forEach(function(entry){
        if(entry.selected){
          entry.status = user.status;
          Roster.setStatus(entry.id, user.status);
        }
      });

      $scope.multiselectCancel();
    }
    else{
      Roster.setStatus(user.id, user.status);
      user.last_activity = $filter('date')(new Date(),'yyyy-MM-ddTHH:mm:ss.sssZ');

      if (user.status==='out' && user.type==='guest'){

      }
    }

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

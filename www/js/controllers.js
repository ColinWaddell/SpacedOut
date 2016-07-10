angular.module('app.controllers', [])


.controller('alertCtrl', function($scope, Roster) {
  
})

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

.controller('spacedOutCtrl', function($scope, $filter, $location, $anchorScroll, $ionicPopup, ionicToast, Roster) {
  $scope.roster = {
    'entries': []
  };

  $scope.interface = {
    'status': 'all',
    'type': 'all',
    'multiselect': false
  }

  $scope.rosterCount = function(id, value){
    var count = 0;

    if(!$scope.roster.entries)
      return;

    $scope.roster.entries.forEach(
      function(entry){
        if(entry[id]===value)
          count++;
      }
    )

    return count;
  };

  $scope.multiselectCancel = function(){
    $scope.interface.multiselect = false;
    $scope.roster.entries.forEach(
      function(entry){
        entry.selected = false;
      }
    );
  }

  $scope.selectEntry = function(entry){
    if($scope.interface.multiselect){
      entry.selected = !(entry.selected==true);
      var numselected=0;
      $scope.roster.entries.forEach(
        function(entry){
          if(entry.selected)
            numselected++
        }
      );

      if(!numselected)
        $scope.multiselectCancel();
    }
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
          Roster.setStatus(entry, user.status);
        }
      });

      $scope.multiselectCancel();
    }
    else{
      Roster.setStatus(user, user.status);
      user.last_activity = $filter('date')(new Date(),'yyyy-MM-ddTHH:mm:ss.sssZ');

      if (user.status==='out' && user.type==='guest'){
        var confirmPopup = $ionicPopup.confirm({
          title: 'Remove Guest',
          template: user.name + ' is a guest.<br /><br />Remove them from the Roster?',
          buttons: [
            {
              text: 'No Thanks',
              type: 'button-default',
              onTap: function(e) {
                return false;
              }
            },
            {
              text: 'Yes Please',
              type: 'button-default',
              onTap: function(e) {
                return true;
              }
            }
        ]
        });

        confirmPopup.then(function(res) {
          if(res) {
            // Delete Guest
            Roster.delete(user.id);
            $scope.rosterReload();
          } else {

          }
        });

      }
    }

  }

  $scope.shortcutJump = function(id) {
    id = "shortcut"+id;
    var old = $location.hash();
    $location.hash(id);
    $anchorScroll();
  };

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

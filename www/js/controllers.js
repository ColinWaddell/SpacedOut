angular.module('app.controllers', [])


.controller('alertCtrl', function($scope, Settings, Roster, Admin, ionicToast) {
  $scope.alertSend = function() {
      if(window.plugins && window.plugins.emailComposer) {
        window.plugins.emailComposer.showEmailComposerWithCallback(function(result) {
            console.log("Response -> " + result);
        },
        "Feedback for your App", // Subject
        "",                      // Body
        ["test@example.com"],    // To
        null,                    // CC
        null,                    // BCC
        false,                   // isHTML
        null,                    // Attachments
        null);                   // Attachment Data
    }
  }

  Settings.onUpdate($scope, function(){
    Settings.get().then(function(settings){$scope.settings = settings;});
  });
  Settings.get().then(function(settings){$scope.settings = settings;});

  $scope.admin = Admin.status;
})

.controller('settingsCtrl', function($scope, $ionicPopup, ionicToast, Roster, Settings, Admin, SS_TIMES, ADD_OPTIONS) {
  $scope.admin = Admin.status;

  $scope.Nuke = function(){
    Roster.deleteAll();
    Settings.reset();
  }

  $scope.update = function(){
    if($scope.settings){
      Settings.update($scope.settings);
    }
  }

  $scope.updatePassword = function(){

    var dialog_current = {
      title: 'Current Password',
      template: 'Enter your current password',
      inputType: 'password',
      inputPlaceholder: 'Current password'
    };

    var dialog_new = {
      title: 'New Password',
      template: 'Enter your new password',
      inputType: 'password',
      inputPlaceholder: 'New password'
    }

    var dialog_repeat = {
      title: 'Repeat New Password',
      template: 'Repeat your new password',
      inputType: 'password',
      inputPlaceholder: 'Repeat password'
    }

    var getNewPassword = function(){
      $ionicPopup.prompt(dialog_new)
      .then(function(new_pass) {
        if (new_pass.length===0){
          ionicToast.show(
            'No password set', 'middle', false, 1500
          );
          return;
        }

        $ionicPopup.prompt(dialog_repeat)
        .then(function(repeat_pass) {
          if(new_pass===repeat_pass){
            // password ok
            Settings.setSetting('password', new_pass)
            ionicToast.show(
              'New Password set', 'middle', false, 1500
            );
          }
          else{
            // passwords dont match
            ionicToast.show(
              'Passwords Don\'t Match', 'middle', false, 1500
            );
          }
        });
      });
    }

    Settings.getSetting('password').then(
      function(result){
        current_password = result.password;

        if (current_password.length===0){
          getNewPassword();
        }
        else{
          $ionicPopup.prompt(dialog_current)
          .then(function(attempt) {
             if(attempt===current_password){
               getNewPassword();
             }
             else{
               if(attempt.length){
                 // incorrect password
                 ionicToast.show(
                   'Incorrect Password', 'middle', false, 1500
                 );
               }
             }
           });
        }
      });
  }

  Settings.onUpdate($scope, function(){
    Settings.get().then(function(settings){$scope.settings = settings;});
  });

  Settings.get().then(function(settings){$scope.settings = settings;});
  $scope.screensaver_times = SS_TIMES;
  $scope.add_options = ADD_OPTIONS;
})

.controller('spacedOutAddCtrl', function($scope, $state, Roster, Settings, Admin, USER_DEFAULT) {

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

  Settings.onUpdate($scope, function(){
    Settings.get().then(function(settings){$scope.settings = settings;});
  });

  Settings.get().then(function(settings){$scope.settings = settings;});
  $scope.user = USER_DEFAULT;
  $scope.admin = Admin.status;
})

.controller('spacedOutCtrl', function($scope, $filter, $location, $anchorScroll, $ionicPopup, ionicToast, Roster, Admin, Settings) {
  $scope.roster = {
    'entries': []
  };

  $scope.admin = Admin.status;

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
    );

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

      if ($scope.settings.rights_auto_remove_guest && user.status==='out' && user.type==='guest'){
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
            Roster.delete(user);
            $scope.rosterReload();
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

  Settings.onUpdate($scope, function(){
    Settings.get().then(function(settings){$scope.settings = settings;});
  })

  Settings.get().then(function(settings){$scope.settings = settings;});
  $scope.rosterReload();
})

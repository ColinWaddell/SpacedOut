angular.module('app.controllers', [])


.controller('screensaverCtrl', function($scope, $interval, Screensaver) {

  var timerPromise;

  self.tick = function(){
    $scope.info.date = new Date();
  }

  self.start = function(){
    $interval.cancel(timerPromise);
    timerPromise = $interval(self.tick, 1000);
  };

  $scope.info = {
    date: new Date()
  }

  self.start();
})

.controller('logCtrl', function($scope, Roster, Screensaver, Log, Admin, $ionicPopup, ionicToast) {

  $scope.logPopulate = function(data){
      $scope.log.entries = JSON.parse(JSON.stringify(data));
  }

  $scope.logError = function (){
    var alertPopup = $ionicPopup.alert({
      title: 'Roster Error',
      template: 'Sorry - Try restarting the app.',
      okText: 'Apology Accepted'
    });
  }

  $scope.log =
    Log
      .all()
      .then(
        $scope.logPopulate,
        $scope.logError
      );

  $scope.admin = Admin.status;

  $scope.logReload = function(settings){
    $scope.log =
      Log
        .all()
        .then(
          $scope.logPopulate,
          $scope.logError
        );
  };

  Log.registerObserverCallback($scope.logReload);
})

.controller('alertCtrl', function($scope, Settings, Screensaver, Roster, Admin, ionicToast) {
  $scope.alertSend = function() {
    Roster
      .all()
      .then(
        function(data){
          var entries = JSON.parse(JSON.stringify(data));

          var BuildEmail = function(){
              var email = "<table>";
              email += "<tr><th>Name</th><th>Status</th></tr>"

              entries.forEach(
                function(entry){
                  email += "<tr><th>" + entry.name + "</th><th>Signed " + entry.status.toUpperCase() + "</th></tr>";
                }
              );

              email += "</table>";

              return email;
          };

          if(window.plugins && window.plugins.emailComposer) {
              window.plugins.emailComposer.showEmailComposerWithCallback(function(result) {
                  console.log("Response -> " + result);
              },
              "Spaced Out Roster",          // Subject
              BuildEmail(),                     // Body
              [$scope.settings.alert_email],    // To
              null,                             // CC
              null,                             // BCC
              true,                             // isHTML
              null,                             // Attachments
              null);                            // Attachment Data
          }
      });
  }

  Settings.onUpdate($scope, function(){
    Settings.get().then(function(settings){$scope.settings = settings;});
  });
  Settings.get().then(function(settings){
    $scope.settings = settings;
  });

  $scope.admin = Admin.status;
})

.controller('settingsCtrl', function($scope, $ionicPopup, ionicToast, Screensaver, Roster, Settings, Admin, Log, SS_TIMES, ADD_OPTIONS) {
  $scope.admin = Admin.status;
  $scope.settings = {};

  $scope.NukeLog = function(){
    var confirmPopup = $ionicPopup.confirm({
      title: 'Clear Log',
      template: 'Are you sure you want to clear the log',
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
        Log.Clear();
      }
    });
  };

  $scope.RosterImport = function(){

  };

  $scope.RosterExport = function(){
    cordova.plugins.clipboard.copy("fuck");
  };

  $scope.NukeRoster = function(){
    var confirmPopup = $ionicPopup.confirm({
      title: 'Clear Roster',
      template: 'Are you sure you want to remove all users from the roster?',
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
        Roster.deleteAll();
      }
    });
  }

  $scope.NukeSettings = function(){
    var confirmPopup = $ionicPopup.confirm({
      title: 'Reset Settings',
      template: 'Are you sure you want to reset the settings to their defaults and clear the admin password?',
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
        Settings.reset();
      }
    });
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
        if (!new_pass || new_pass.length===0){
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

        if (!current_password || current_password.length===0){
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
    Settings.get().then(function(settings){
      $scope.settings = settings;
    });
  });

  Settings.get().then(function(settings){
    $scope.settings = settings;
  });
  $scope.screensaver_times = SS_TIMES;
  $scope.add_options = ADD_OPTIONS;

  $scope.settingsReload = function(settings){
    Settings.get().then(function(settings){
      $scope.settings = settings;
    });
  };

  Settings.registerObserverCallback($scope.settingsReload);

})

.controller('spacedOutAddCtrl', function($scope, $state, Screensaver, Roster, Settings, Admin, USER_DEFAULT) {

  $scope.userAddSuccess = function(data){
    $scope.user.name = "";
    $scope.user.type = 'staff';
    $scope.user.status = 'out';
    $scope.multiname = {'show': false, 'names': [""]};
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

  $scope.staffClickAdminTest = function(){
    if(!!$scope.admin.enabled !== !!$scope.settings.add_option){
      $scope.user.type = "guest";
      Admin.request(
        "You need to be an admin to add staff",
        function(){
          $scope.user.type="staff";
        }
      );
    }
    else{
      $scope.user.type="staff";
    }
  }
  
  function settingsUpdate(settings){
    $scope.settings = settings;
    if(settings.add_option){
      $scope.user.type = "guest";
    }
  }

  Settings.onUpdate($scope, function(){
    Settings.get().then(settingsUpdate);
  });

  Admin.onUpdate($scope, function(){
    if(!!$scope.admin.enabled !== !!$scope.settings.add_option){
      $scope.user.type = "guest";
    }
  });

  Settings.get().then(settingsUpdate);
  $scope.user = USER_DEFAULT;
  $scope.multiname = {'show': false, 'names': [""]};
  $scope.admin = Admin.status;
})

.controller('spacedOutCtrl', function(
  $scope,
  $filter,
  $location,
  $anchorScroll,
  $ionicPopup,
  ionicToast,
  Roster,
  Screensaver,
  Admin,
  Settings,
  rosterInterface
){
  $scope.roster = {
    'entries': []
  };

  $scope.rosterCount = {
    'status': {'in': 0, 'out': 0},
    'type': {'staff': 0, 'guest': 0},
  }

  $scope.interface = {
    'status': 'all',
    'type': 'all',
    'multiselect': false
  }

  rosterInterface.registerObserverCallback(function(itfc){
    $scope.interface = itfc;
  });

  $scope.deleteSelected = function(){
    var selected = [];

    var deleteEntries = function(){
      $scope.roster.entries.forEach(
        function(entry){
          if(entry.selected){
            selected.push(entry);
          }
        }
      );

      selected.forEach(function(entry){
        Roster.delete(entry);
      })

      if (selected.length){
        $scope.rosterReload();
      }

      $scope.multiselectCancel();
    }

    if (Admin.status.enabled){
      deleteEntries();
    }
    else{
      Admin.request(
        "You need to be an admin to delete users",
        deleteEntries
      );
    }
  };

  $scope.rosterCountUpdate = function(){
    var count = {
      'type': {'staff': 0, 'guest': 0},
      'status': {'in': 0, 'out': 0}
    };

    if($scope.roster.entries){
      $scope.roster.entries.forEach(
        function(entry){
          count.type[entry.type]++;
          count.status[entry.status]++;
        }
      );
    }

    $scope.rosterCount = count;
  };

  $scope.multiselectCancel = function(){
    $scope.interface.multiselect = false;

    if(!$scope.roster.entries)
      return;

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

  $scope.invertStatus = function(user){
    user.status = user.status==='in'?'out':'in';
    $scope.toggleStatus(user);
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
      $scope.rosterCountUpdate();
    }
    else{
      Roster.setStatus(user, user.status);
      $scope.rosterCountUpdate();
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
      $scope.roster.entries = JSON.parse(JSON.stringify(data));
      $scope.rosterCountUpdate();
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

  $scope.admin = Admin.status;

  Roster.registerObserverCallback($scope.rosterReload);

  Settings.onUpdate($scope, function(){
    Settings.get().then(function(settings){
      $scope.settings = JSON.parse(JSON.stringify(settings));
    });
  })

  Settings.get().then(function(settings){
    $scope.settings = JSON.parse(JSON.stringify(settings));
  });
  $scope.rosterReload();
})

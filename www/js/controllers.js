angular.module('app.controllers', [])


.controller('screensaverCtrl', function($scope, $interval, $timeout, $http, Screensaver) {

  var timerPromise;

  $scope.swipe = function(){
    $scope.message='Loading Roster   ';
    Screensaver.exit();
  }

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

  $scope['message'] = "Tap to Sign In";


  Screensaver.addTimeout(30 * 6, function(){
    document.location.href = 'index.html';
  });

  /*
   * SPACE FACTS
   */

  var spacefacts = [""];

  $http.get('json/facts.json')
  .then(function(result){
      spacefacts = result.data;
      loadSpacefact();
  });

  var loadSpacefact =  function(){
    var id = Math.floor( Math.random() * spacefacts.length );
    $scope.spacefact = spacefacts[id];
  };

  $scope['spacefact'] = "Loading fact...";
  Screensaver.addTimeout(5 * 6, loadSpacefact);

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

.controller('backupCtrl', function(
  $scope,
  $sanitize,
  Roster,
  Screensaver,
  Settings,
  Log,
  Admin,
  $ionicPopup,
  ionicToast
) {

  $scope.data = {
    'import': '',
    'export': ''
  };

  var importParser = function(data){
    var entries = [];
    var splitter = /(#|\$)\w+( \w+)*/g;
    var e;

    while ((e = splitter.exec(data)) !== null) {
      if (e.index === splitter.lastIndex) {
          splitter.lastIndex++;
      }

      if(e[0] && e[0].length>4){
        // Get Name
        var name = e[0].substr(1);
        // Guest or Staff?
        var type = (e[0].charAt(0)==='#' ? 'guest' : 'staff');

        // Build entry
        var entry = {
          'name'  : $sanitize(name),
          'type'  : type,
          'status': 'out'
        };

        entries.push(entry);
      }
    }

    return entries;
  }

  $scope.save = function(){

    var entries = importParser($scope.data.import);

    var confirmPopup = $ionicPopup.confirm({
      title: 'Import ' + entries.length + ' Entries',
      template: 'Importing will wipe the current roster and replace it with this one. Are you sure you want to continue?',
      buttons: [
        {
          text: 'Cancel Import',
          type: 'button-default',
          onTap: function(e) {
            return false;
          }
        },
        {
          text: 'Overwrite Roster',
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

        Roster
          .add(entries)
          .then(
            $scope.importSuccess,
            $scope.importError
          );
      }
    });
  };


  $scope.importSuccess = function(){
    ionicToast.show(
      'Roster Imported Successfully', 'middle', false, 1500
    );
  }

  $scope.importError = function(){
    ionicToast.show(
      'Error with database. Can\'t import roster.', 'middle', false, 1500
    );
  }

  $scope.export = function() {
    if(window.plugins && window.plugins.emailComposer) {
        window.plugins.emailComposer.showEmailComposerWithCallback(function(result) {
            console.log("Response -> " + result);
        },
        "Spaced Out Roster Backup",              // Subject
        $scope.rosterdumpExportHTML,      // Body
        [$scope.settings.alert_email],    // To
        null,                             // CC
        null,                             // BCC
        true,                             // isHTML
        null,                             // Attachments
        null);                            // Attachment Data
    }
  }

  Roster
    .all()
    .then(
      function(data){
        var entries = JSON.parse(JSON.stringify(data));

        $scope.data.export = "";

        entries.forEach(
          function(entry){
            var s = (entry.type==="guest"?'#':'$') + entry.name;
            $scope.data.export += s + "<br />";
          }
        );
    });

  Settings.onUpdate($scope, function(){
    Settings.get().then(function(settings){$scope.settings = settings;});
  });
  Settings.get().then(function(settings){
    $scope.settings = settings;
  });
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
      $scope.settings = JSON.parse(JSON.stringify(settings));
    });
  });

  Settings.get().then(function(settings){
    $scope.settings = JSON.parse(JSON.stringify(settings));
  });
  $scope.screensaver_times = SS_TIMES;
  $scope.add_options = ADD_OPTIONS;

  $scope.settingsReload = function(settings){
    Settings.get().then(function(settings){
      $scope.settings = JSON.parse(JSON.stringify(settings));
    });
  };

  Settings.registerObserverCallback($scope.settingsReload);

})

.controller('spacedOutAddCtrl', function(
  $scope,
  $state,
  $sanitize,
  ionicToast,
  Screensaver,
  Roster,
  Settings,
  Admin,
  USER_DEFAULT)
{

  $scope.userAddReset = function(){
    $scope.user.name = "";
    $scope.user.status = 'out';
    $scope.multiname = {'show': false, 'names': [""]};

    if(!!$scope.admin.enabled !== !!$scope.settings.add_option){
      $scope.user.type = "guest";
    }
  }

  $scope.userAddSuccess = function(data){
    $scope.userAddReset();

    $state
      .go('tabsController.spacedOut');
  };

  $scope.userAddError = function(){
    console.log('userAddError');
  };

  $scope.rosterAdd = function(){
    if ($scope.user.name.lengh < 3)
      return;

    users = [{
      'name'  : $sanitize($scope.user.name),
      'type'  : $scope.user.type,
      'status': $scope.user.status
    }];

    var error = "";

    if($scope.multiname.show){
      $scope
        .multiname
        .names
        .forEach(function(name){
          if (name.length < 3){
            error = "Names must be longer than 2 letters"
            return;
          }

          users.push({
            'name': $sanitize(name),
            'type': $scope.user.type,
            'status': $scope.user.status
          });
        });
    }

    if (error!==""){
      ionicToast.show(
        error, 'middle', false, 1500
      );
    }

    Roster
      .add(users)
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
    $scope.settings = JSON.parse(JSON.stringify(settings));
    if(settings.add_option){
      $scope.user.type = "guest";
    }
  }

  Screensaver.onExit($scope, $scope.userAddReset);

  Settings.onUpdate($scope, function(){
    Settings.get().then(settingsUpdate);
  });

  Admin.onUpdate($scope, function(){
    if(!!$scope.admin.enabled !== !!$scope.settings.add_option){
      $scope.user.type = "guest";
    }
  });

  $scope.settings = {};
  Settings.get().then(settingsUpdate);
  $scope.user = USER_DEFAULT;
  $scope.multiname = {'show': false, 'names': [""]};
  $scope.admin = Admin.status;
})

.controller('editPopover', function(
  $scope,
  $interval,
  $ionicPopup,
  Roster
){
  $scope.interface.edit = {
    'show': false
  }

  $scope.editName = function(){
    var selected = $scope.getSelected();

    if (selected.length!==1)
      return;

    var user = selected[0];

    $ionicPopup.prompt({
       title: 'Enter a new name for' + user.name,
       inputPlaceholder: selected[0].name,
       defaultText: selected[0].name
     }).then(function(name) {
       if(name!==""){
         user.name = name;
         Roster.update(user);
       }
     });

     $scope.editCancel();
  }

  $scope.editType = function(){
    var selected = $scope.getSelected();

    if (!selected.length)
      return;

    var name = (selected.length > 1)
             ? 'Users'
             : selected[0].name;

     var typeSelect = $ionicPopup.confirm({
       title: name + ' should be...',
       buttons: [
         {
           text: 'Guest',
           type: 'button-default',
           onTap: function(e) {
             return 'guest';
           }
         },
         {
           text: 'Staff',
           type: 'button-default',
           onTap: function(e) {
             return 'staff';
           }
         }
     ]
     });

     typeSelect.then(function(res) {
       selected.forEach(function(user){
         user.type = res;
         Roster.update(user);
       })
     });

     $scope.editCancel();
  }

  $scope.editCancel = function(){
    $scope.edit.hide();
    $scope.multiselectCancel();
  };
})

.controller('spacedOutCtrl', function(
  $scope,
  $filter,
  $location,
  $anchorScroll,
  $ionicPopup,
  $ionicPopover,
  $ionicScrollDelegate,
  $interval,
  $timeout,
  $templateCache,
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

  $scope.scrollTop = function() {
    $ionicScrollDelegate.scrollTop(false);
  };

  $scope.getSelected = function(){
    var selected = [];

    $scope.roster.entries.forEach(
      function(entry){
        if(entry.selected){
          selected.push(entry);
        }
      }
    );

    return selected;
  }

  $scope.deleteSelected = function(){

    var deleteEntries = function(){
      selected = $scope.getSelected();

      selected.forEach(function(entry){
        Roster.delete(entry);
      })

      if (selected.length){
        $scope.rosterReload();
      }

      $scope.multiselectCancel();
      $scope.edit.hide()
    }

    if (Admin.status.enabled || !$scope.settings.rights_add_remove_users){
      deleteEntries();
    }
    else{
      Admin.request(
        "You need to be an admin to delete users",
        deleteEntries
      );
    }
  };

  var popoverTimer;

  $ionicPopover.fromTemplateUrl('templates/rosterEdit.html', {
    scope: $scope,
  }).then(function(popover) {
    $scope.edit = popover;
  });

  $scope.popoverInit = function(){

    var edit = function(){
      $scope.popoverTimerCancel();
      popoverTimer = $interval($scope.popoverTimeout, 10000);
    };

    var cancel = function(){
      $scope.edit.hide();
    }

    if($scope.settings.rights_add_remove_users){
     if(!Admin.status.enabled){
       Admin.request(
         "Admin rights are required to edit users",
         edit, cancel
       );
     }
    }
    else{
     edit();
    }
  }

  $scope.popoverTimerCancel = function(){
    if($scope.interface.edit){
      $scope.interface.edit.show = false;
    }
    $interval.cancel(popoverTimer);
  }

  $scope.popoverTimeout = function(){
    $scope.edit.hide();
    $scope.popoverTimerCancel();
    $scope.multiselectCancel();
  }

  //Cleanup the popover when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.edit.remove();
  });

  // Execute action on hide popover
 $scope.$on('popover.hidden', function() {
   $scope.popoverTimerCancel();
 });

 var scrolleventCounter = 0;
 $scope.screensaverKick = function(){
   if(!scrolleventCounter){
     $timeout(function(){
       Screensaver.kick();
       scrolleventCounter = 0;
     }, 30000);
   }
  scrolleventCounter++;
 }

 $scope.showInfo = function(){
   var info = $templateCache.get('info.html');

   ionicToast.show(
     info, 'middle', false, 2000
   );
 }

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

  $scope.numSelected = function(){
    var numselected=0;

    if(!$scope.roster){
      return 0
    }
    else if (!$scope.roster.entries){
      return 0;
    }

    $scope.roster.entries.forEach(
      function(entry){
        if(entry.selected)
          numselected++
      }
    );

    return numselected;
  }

  $scope.selectEntry = function(entry){
    if($scope.interface.multiselect){
      entry.selected = !(entry.selected==true);

      if(!$scope.numSelected())
        $scope.multiselectCancel();
    }
  }

  $scope.filterStatus = function(status){
    $scope.interface.status = status;
  }

  $scope.firstLetter = function(name) {
    if (name === undefined)
      return;

    var letter = name.toUpperCase() && name.toUpperCase().charAt(0);
    if (/^[A-Za-z]+$/.test(letter)){
      return letter;
    }
    else{
      return '#';
    }
  }

  $scope.invertStatus = function(user){
    user.status = user.status==='in'?'out':'in';
    $scope.toggleStatus(user);
    $scope.rosterFilter();

    /* HERE IS THE EASTER EGG */
    if(user.name==="Paul Yarr"){
      if (+(moment().format('\155')%0x1E)) return;

      ionicToast.show(
        '<img src="img/yarr.jpg"></img>', 'top', false, 300
      );
    }
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
              text: 'Sign-Out',
              type: 'button-default',
              onTap: function(e) {
                return false;
              }
            },
            {
              text: 'Delete User',
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

  $scope.entryTap = function(entry){
    if($scope.interface.multiselect){
      $scope.selectEntry(entry);
    }
    else{
      $scope.invertStatus(entry);
    }
  }

  $scope.shortcutJump = function(letter) {
    /*
     * A very roundabout way of making the
     * shortcut scrolling action less janky.
    */
    var id = "#shortcut"+letter;
    var loc = "#" + $location.path()+ id;
    history.pushState(null, null, loc);
  };

  $scope.rosterFilter = function(){
    angular.forEach($scope.roster.entries, function(item) {
      var hide = true;
      if($scope.interface.status==='all' || $scope.interface.status==item.status)
        if($scope.interface.type==='all' || $scope.interface.type==item.type)
          hide = false;

      item.hide = hide;
    });
  };

  $scope.rosterPopulate = function(data){
    $scope.roster.entries = JSON.parse(JSON.stringify(data));
    $scope.rosterFilter();
    $scope.rosterCountUpdate();
  };

  $scope.rosterError = function (){
    var alertPopup = $ionicPopup.alert({
      title: 'Roster Error',
      template: 'Sorry - Try restarting the app.',
      okText: 'Apology Accepted'
    });
  }

  $scope.rosterReload = function(e){
    if(e==='status') return;

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

  Screensaver.onExit($scope, function(){
    $scope.multiselectCancel();
  })

  // Scroll to top after 30seconds of inactivity
  Screensaver.addTimeout(30, $scope.scrollTop);
  Screensaver.addTimeout(30, function(){
    $scope.interface = {
      'status': 'all',
      'type': 'all',
      'multiselect': false
    }
  });
});

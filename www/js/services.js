angular.module('app.services', [])

.factory('DB', function($q, DB_CONFIG) {
    var self = this;
    self.db = null;

    self.init = function() {
        //self.db = window.sqlitePlugin.openDatabase({name: DB_CONFIG.name}); // Production
        self.db = window.openDatabase(DB_CONFIG.name, '1.0', 'database',  5 * 1024 * 1024);

        angular.forEach(DB_CONFIG.tables, function(table) {
            var columns = [];

            angular.forEach(table.columns, function(column) {
                columns.push(column.name + ' ' + column.type);
            });

            var query = 'CREATE TABLE IF NOT EXISTS ' + table.name + ' (' + columns.join(',') + ')';
            self.query(query);
            console.log('Table ' + table.name + ' initialized');
        });
    };

    self.query = function(query, bindings) {
        bindings = typeof bindings !== 'undefined' ? bindings : [];
        var deferred = $q.defer();

        self.db.transaction(function(transaction) {
            transaction.executeSql(query, bindings, function(transaction, result) {
                deferred.resolve(result);
            }, function(transaction, error) {
                deferred.reject(error);
            });
        });

        return deferred.promise;
    };

    self.fetchAll = function(result) {
        var output = [];

        for (var i = 0; i < result.rows.length; i++) {
            output.push(result.rows.item(i));
        }

        return output;
    };

    self.fetch = function(result) {
      if (result.rows.length)
        return result.rows.item(0);
      else
        return null;
    };

    return self;
})

.factory('Log', function(DB, $filter) {
    var self = this;

    var observerCallbacks = [];

    //register an observer
    this.registerObserverCallback = function(callback){
      observerCallbacks.push(callback);
    };

    //call this when you know 'foo' has been changed
    var notifyObservers = function(){
      angular.forEach(observerCallbacks, function(callback){
        callback();
      });
    };

    self.all = function() {
        return DB.query('SELECT * FROM log')
        .then(function(result){
            var result = DB.fetchAll(result);
            return result.reverse();
        });
    };

    self.log = function(eventType, entry) {
      last_activity = $filter('date')(new Date(),'yyyy-MM-ddTHH:mm:ss.sssZ');

      var query = 'INSERT INTO log (name, event, status, type, last_activity) VALUES (?,?,?,?,?)';
      var bindings = [];

      if(entry.constructor === Array){
        var count = 0;
        entry.forEach(function(e, i){
          if(i!==0){
            query += ", (?,?,?,?,?)";
          }

          bindings.push(e.name);
          bindings.push(eventType);
          bindings.push(e.status);
          bindings.push(e.type);
          bindings.push(last_activity);
        });
      }
      else{
        bindings = [entry.name, eventType, entry.status, entry.type, last_activity];
      }

      return DB.query(
        query,
        bindings)
      .then(function(result){
        notifyObservers();
        return result.insertId;
      });
    }

    self.Clear = function () {
      return DB.query(
        'DELETE FROM log')
      .then(function(result){
        DB.init();
        notifyObservers();
      });
    }

    return self;
})

.factory('Settings', function(DB, $rootScope) {
  var self = this;

  var observerCallbacks = [];

  //register an observer
  this.registerObserverCallback = function(callback){
    observerCallbacks.push(callback);
  };

  //call this when you know 'foo' has been changed
  var notifyObservers = function(){
    angular.forEach(observerCallbacks, function(callback){
      callback();
    });
  };

  self.preloadSettingsDefaults = function(){
    DB.query(
        "INSERT INTO settings      \
        (screensaver_time,         \
         alert_email,              \
         password,                 \
         rights_send_alert,        \
         rights_access_settings,   \
         rights_add_remove_users,  \
         rights_auto_remove_guest, \
         add_option,               \
         roster_show_datetime)     \
        VALUES (?,?,?,?,?,?,?,?,?)",
      [1, "", "", 0, 0, 0, 1, 0, 1])
    .then(function(result){
      notifyObservers();
    });
  }

  self.getSetting = function(request){
    var req = 'SELECT ' + request + ' FROM settings';
    return DB.query(req)
    .then(function(result){
        return DB.fetch(result);
    });
  }

  self.setSetting = function(request, value){
    var req = 'UPDATE settings SET ' + request + '=(?) WHERE id=1';
    DB.query(req,[value]);
  }

  self.onUpdate = function(scope, callback){
    var handler = $rootScope.$on('settings-update', callback);
    if(scope){
      scope.$on('$destroy', handler);
    }
  }

  self.get = function(){
    return DB.query('SELECT * FROM settings')
    .then(function(result){
        return DB.fetch(result);
    });
  }

  self.update = function(settings){
    DB.query(
        "UPDATE settings SET                      \
         screensaver_time=(?),  alert_email=(?),  \
         rights_send_alert=(?),                   \
         rights_access_settings=(?),              \
         rights_add_remove_users=(?),             \
         rights_auto_remove_guest=(?),            \
         add_option=(?),                          \
         roster_show_datetime=(?)                 \
         WHERE id=1",
      [
        settings.screensaver_time,
        settings.alert_email,
        settings.rights_send_alert,
        settings.rights_access_settings,
        settings.rights_add_remove_users,
        settings.rights_auto_remove_guest,
        settings.roster_show_datetime,
        settings.add_option
      ]
    )
    .then(function(result){
      $rootScope.$emit('settings-update');
      notifyObservers();
    });
  }

  self.init = function(){
    /* Check if settings are empty
       and preload with defaults
       if required */
    return DB.query(
      "SELECT count(*) FROM settings")
    .then(function(count){
      if (count.rows.length && count.rows[0]){
        count = count.rows[0]['count(*)'];
        if(!count){
          self.preloadSettingsDefaults();
        }
      }
      else{
        self.preloadSettingsDefaults();
      }
    });

  }

  self.reset = function () {
    return DB.query(
      'DROP TABLE settings')
    .then(function(result){
      DB.init();
      self.preloadSettingsDefaults();
    });
  }

  self.init();
  return self;
})


.factory('Roster', function(DB, Log, $filter) {
    var self = this;

    var observerCallbacks = [];

    //register an observer
    this.registerObserverCallback = function(callback){
      observerCallbacks.push(callback);
    };

    //call this when you know 'foo' has been changed
    var notifyObservers = function(e){
      angular.forEach(observerCallbacks, function(callback){
        callback(e);
      });
    };

    var formatRoster = function(rows){

      /* build prototype roster */
      var roster = {'#':[]};

      var frm = "a".charCodeAt(0);
      var to  = "z".charCodeAt(0);

      for(a=frm; a<=to; a++){
        var id = String.fromCharCode(a);
        roster[id] = [];
      }

      /* parse roster and categorise */
      rows.forEach(function(row){
        
      })
    }

    self.all = function() {
        return DB.query('SELECT * FROM roster ORDER BY lower(name)')
        .then(function(result){
            return formatRoster(DB.fetchAll(result));
        });
    };

    self.add = function(user) {
      var query = 'INSERT INTO roster (name, status, type, last_activity) VALUES (?,?,?,?)';
      var bindings = [];

      if(user.constructor === Array){
        var count = 0;
        user.forEach(function(u, i){
          if(i!==0){
            query += ", (?,?,?,?)";
          }
          bindings.push(u.name);
          bindings.push(u.status);
          bindings.push(u.type);

          var last_activity =
            (u.status === "in") ?
              $filter('date')(new Date(),'yyyy-MM-ddTHH:mm:ss.sssZ') :
              "";

          bindings.push(last_activity);
        });
      }
      else{
        bindings = [user.name, user.status, user.type, last_activity];
      }

      return DB.query(
        query,
        bindings)
      .then(function(result){
        notifyObservers('add');
        Log.log('add', user);
        return result.insertId;
      });
    }

    self.update = function(user) {
      last_activity = $filter('date')(new Date(),'yyyy-MM-ddTHH:mm:ss.sssZ');
      return DB.query(
        'UPDATE roster SET name=(?), status=(?), type=(?), last_activity=(?) WHERE id = (?)',
        [user.name, user.status, user.type, last_activity, user.id])
        .then(function(result){
          notifyObservers('update');
          Log.log('update', user);
        });
    }


    self.setStatus = function(user, status){
      last_activity = $filter('date')(new Date(),'yyyy-MM-ddTHH:mm:ss.sssZ');
      return DB.query(
        'UPDATE roster SET status = (?), last_activity = (?) WHERE id = (?)',
        [status, last_activity, user.id])
        .then(function(result){
          notifyObservers('status');
          Log.log('status', user);
        });
    }

    self.delete = function (user){
      return DB.query(
        'DELETE FROM roster WHERE id = ?', [user.id])
        .then(function(result){
          notifyObservers('delete');
          Log.log('delete', user);
        });
    }

    self.deleteAll= function () {
      Log.log('DELETE ALL', {});

      return DB.query(
        'DELETE FROM roster')
      .then(function(result){
        DB.init();
        notifyObservers('deleteall');
      });
    }

    return self;
})

.factory('Admin', function($ionicPopup, $rootScope, $state, $interval, Settings, ionicToast, DEFAULT_ADMIN_TTL){
  var self = this;

  var timerPromise;

  self.timerUpdateAdmin = function(){
    self.status.ttl--;
    if(self.status.ttl < 1){
      self.timerStopAdmin();
    }
  }

  self.timerStartAdmin = function(){
    self.status.enabled = true;
    self.status.ttl = DEFAULT_ADMIN_TTL;
    $interval.cancel(timerPromise);
    timerPromise = $interval(self.timerUpdateAdmin, 1000);
    $rootScope.$emit('admin-update');
  };

  self.timerStopAdmin = function(){
    self.status.enabled = false;
    $interval.cancel(timerPromise);
    $state.go('tabsController.spacedOut');
    $rootScope.$emit('admin-update');
  }

  self.tryPassword = function(attempt, answer, success, failure){
      if(answer==attempt){
        self.timerStartAdmin();
        if (success) success();
      }
      else{
        self.timerStopAdmin();
        ionicToast.show(
          'Incorrect Password', 'middle', false, 1500
        );
        if(failure) failure();
      }
  };

  self.request = function(message, success, failure){

    Settings.getSetting('password').then(
      function(result){
        password = result.password;

        if (password===null || password.length===0){
          $ionicPopup.alert({
             title: 'Admin Access',
             template: 'You still need to set an Admin Password in Settings'
           }).then(function(attempt) {
             self.timerStartAdmin();
             if (success) success();
           });
        }
        else{
          $ionicPopup.prompt({
             title: 'Admin Password Required',
             template: message || 'Enter your admin password',
             inputType: 'password',
             inputPlaceholder: 'Your password'
           }).then(function(attempt) {
             self.tryPassword(attempt, password, success, failure);
           });
        }
      });
  };

  self.onUpdate = function(scope, callback){
    var handler = $rootScope.$on('admin-update', callback);
    if(scope){
      scope.$on('$destroy', handler);
    }
  }

  self.status = {
    enabled: false,
    ttl: DEFAULT_ADMIN_TTL,
    cancel: self.timerStopAdmin
  };

  return self;
})

.factory('Screensaver', function(
  $state,
  $document,
  $location,
  $interval,
  $timeout,
  $rootScope,
  Settings,
  rosterInterface
){
  var self = this;

  var observerCallbacks = [];

  var customTimeouts = [];

  //register an observer
  self.registerObserverCallback = function(callback){
    observerCallbacks.push(callback);
  };

  //call this when you know 'foo' has been changed
  var notifyObservers = function(){
    angular.forEach(observerCallbacks, function(callback){
      callback();
    });
  };

  var timerPromise;

  self.tick = function(){

    self.status.time++;
    if(self.status.time === self.status.timeout){
      self.showScreensaver();
    }

    // test custom timeouts
    customTimeouts.forEach(
      function(ct){
        if(self.status.time == ct.time){
          ct.callback();
        }
      }
    );
  }

  self.start = function(){
    Settings.getSetting('screensaver_time')
      .then(function(result){
        self.status.timeout = result.screensaver_time * 60;
        self.status.time = 0;
        $interval.cancel(timerPromise);
        timerPromise = $interval(self.tick, 1000);
    });
  };

  self.addTimeout = function(time, callback){
    customTimeouts.push(
      {
        'time': time,
        'callback': callback
      }
    );
  }

  self.kick = function(){
    self.status.time = 0;
  }

  self.exit = function(){
    self.start();
    $state.go('tabsController.spacedOut',{}, {reload: true});
  }

  self.status = {
    sleeping: false,
    time: 0,
    timeout: 60,
    cancel: self.timerStopAdmin
  };

  self.showScreensaver = function(){
    self.status.enabled = false;
    self.status.sleeping = true;
    $state.go('tabsController.screensaver');
  }

  $document.on('click',function(){
    if(self.status.sleeping){
      $timeout(function () {
        self.status.sleeping = false;
        rosterInterface.update(
          {
            'status': 'all',
            'type': 'all',
            'multiselect': false
          }
        );
        $state.go('tabsController.spacedOut',{}, {reload: true});
        $rootScope.$emit('screensaver-exit');
        notifyObservers();
        self.start();
      }, 250);
    }
    else{
      self.status.time = 0;
    }
  });

  self.onExit = function(scope, callback){
    var handler = $rootScope.$on('screensaver-exit', callback);
    if(scope){
      scope.$on('$destroy', handler);
    }
  }

  Settings.onUpdate(null, function(){
    Settings.get().then(
      function(settings){
        self.status.timeout = settings.screensaver_time * 60;
      });
  });

  self.start();

  return self;
})

.factory('rosterInterface', function($rootScope) {
  var sharedService = {};

  sharedService.interface = {
    'status': 'all',
    'type': 'all',
    'multiselect': false
  };

  var observerCallbacks = [];

  //register an observer
  sharedService.registerObserverCallback = function(callback){
    observerCallbacks.push(callback);
  };

  //call this when you know 'foo' has been changed
  var notifyObservers = function(itfc){
    angular.forEach(observerCallbacks, function(callback){
      callback(itfc);
    });
  };

  sharedService.update = function(itfc) {
      this.interface = itfc;
      notifyObservers(this.interface);
  };

  return sharedService;
});

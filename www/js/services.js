angular.module('app.services', [])

.factory('DB', function($q, DB_CONFIG) {
    var self = this;
    self.db = null;

    self.init = function() {
        //self.db = window.sqlitePlugin.openDatabase({name: DB_CONFIG.name}); // Production
        self.db = window.openDatabase(DB_CONFIG.name, '1.0', 'database', -1);

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
        return result.rows.item(0);
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
            return DB.fetchAll(result);
        });
    };

    self.log = function(eventType, entry) {
      last_activity = $filter('date')(new Date(),'yyyy-MM-ddTHH:mm:ss.sssZ');
      return DB.query(
        'INSERT INTO log (name, event, status, type, last_activity) VALUES (?,?,?,?,?)',
        [entry.name, eventType, entry.status, entry.type, last_activity])
      .then(function(result){
        notifyObservers();
        return result.insertId;
      });
    }

    self.deleteAll= function () {
      return DB.query(
        'DELETE FROM log')
      .then(function(result){
        DB.init();
      });
    }

    return self;
})

.factory('Settings', function(DB, $rootScope) {
  var self = this;

  self.preloadSettingsDefaults = function(){
    DB.query(
        "INSERT INTO settings      \
        (screensaver_time,        \
        alert_email,              \
         password,                \
         rights_send_alert,       \
         rights_access_settings,  \
         rights_add_remove_users, \
         add_option)              \
        VALUES (?,?,?,?,?,?,?)",
      [1, "", "", 0, 0, 0, 0])
    .then(function(result){
      console.log(result);
    });
  }

  self.getSetting = function(request){
    var req = 'SELECT ' + request + ' FROM settings';
    return DB.query(req)
    .then(function(result){
        return DB.fetch(result);
    });
  }

  self.onUpdate = function(scope, callback){
    var handler = $rootScope.$on('settings-update', callback);
    scope.$on('$destroy', handler);
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
         add_option=(?)                           \
         WHERE id=1",
      [
        settings.screensaver_time,
        settings.alert_email,
        settings.rights_send_alert,
        settings.rights_access_settings,
        settings.rights_add_remove_users,
        settings.add_option
      ]
    )
    .then(function(result){
      $rootScope.$emit('settings-update');
    });
  }

  self.init = function(){
    /* Check if settings are empty
       and preload with defaults
       if required */
    return DB.query(
      "SELECT count(*) FROM settings")
    .then(function(count){
      count = count.rows[0]['count(*)'];
      if(!count){
        self.preloadSettingsDefaults();
      }
    });

  }

  self.reset = function () {
    return DB.query(
      'DROP TABLE settings')
    .then(function(result){
      DB.init();
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
    var notifyObservers = function(){
      angular.forEach(observerCallbacks, function(callback){
        callback();
      });
    };

    self.all = function() {
        return DB.query('SELECT * FROM roster ORDER BY lower(name)')
        .then(function(result){
            return DB.fetchAll(result);
        });
    };

    self.add = function(user) {
      last_activity =
        (user.status === "in") ?
          $filter('date')(new Date(),'yyyy-MM-ddTHH:mm:ss.sssZ') :
          "";

      return DB.query(
        'INSERT INTO roster (name, status, type, last_activity) VALUES (?,?,?,?)',
        [user.name, user.status, user.type, last_activity])
      .then(function(result){
        notifyObservers();
        Log.log('add', user);
        return result.insertId;
      });
    }

    self.setStatus = function(user, status){
      last_activity = $filter('date')(new Date(),'yyyy-MM-ddTHH:mm:ss.sssZ');
      return DB.query(
        'UPDATE roster SET status = (?), last_activity = (?) WHERE id = (?)',
        [status, last_activity, user.id])
        .then(function(result){
          notifyObservers();
          Log.log('status', user);
        });
    }

    self.delete = function (user){
      return DB.query(
        'DELETE FROM roster WHERE id = ?', [user.id])
        .then(function(result){
          notifyObservers();
          Log.log('delete', user);
        });
    }

    self.deleteAll= function () {
      return DB.query(
        'DELETE FROM roster')
      .then(function(result){
        DB.init();
      });
    }

    return self;
})

.filter('filterEntries', function() {
    return function( items, interface ) {
      var filtered = [];
      angular.forEach(items, function(item) {
        if(interface.status==='all' || interface.status==item.status)
          if(interface.type==='all' || interface.type==item.type)
            filtered.push(item);
      });
      return filtered;
    };
})

.factory('Admin', function($ionicPopup, $state, $interval, Settings, ionicToast, DEFAULT_ADMIN_TTL){
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
  };

  self.timerStopAdmin = function(){
    self.status.enabled = false;
    $interval.cancel(timerPromise);
    $state.go('tabsController.spacedOut');
  }

  self.tryPassword = function(attempt, success){
    Settings.getSetting('password').then(
      function(result){
        password = result.password;
        if(password==attempt){
          self.timerStartAdmin();
          if (success) success();
        }
        else{
          self.timerStopAdmin();
          ionicToast.show(
            'Incorrect Password', 'middle', false, 1500
          );
        }
      });
  };

  self.request = function(message, success){
    $ionicPopup.prompt({
       title: 'Admin Password Required',
       template: message || 'Enter your admin password',
       inputType: 'password',
       inputPlaceholder: 'Your password'
     }).then(function(pass) {
       self.tryPassword(pass, success);
     });
  };

  self.status = {
    enabled: false,
    ttl: DEFAULT_ADMIN_TTL,
    cancel: self.timerStopAdmin
  };

  return self;
});

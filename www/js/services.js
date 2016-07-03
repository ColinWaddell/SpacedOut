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

.factory('Roster', function(DB, $filter) {
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
        return result.insertId;
      });
    }

    self.setStatus = function(id, status){
      last_activity = $filter('date')(new Date(),'yyyy-MM-ddTHH:mm:ss.sssZ');
      return DB.query(
        'UPDATE roster SET status = (?), last_activity = (?) WHERE id = (?)',
        [status, last_activity, id])
        .then(function(result){

        });
    }

    self.delete = function (id){
      return DB.query(
        'DELETE FROM roster WHERE id = ?', [id]);
    }

    self.deleteAll= function () {
      return DB.query(
        'DROP TABLE roster')
      .then(function(result){
        DB.init();
      });
    }

    return self;
})

.filter('filterEntries', function() {
    return function( items, interface ) {
      console.log('filterEntries');
      var filtered = [];
      angular.forEach(items, function(item) {
        if(interface.status==='all' || interface.status==item.status)
          if(interface.type==='all' || interface.type==item.type)
            filtered.push(item);
      });
      return filtered;
    };
});

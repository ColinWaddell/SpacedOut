angular.module('app.routes', [])


.constant('DB_CONFIG',
  {
    name: 'DB',
    tables: [
      {
        name: 'roster',
        columns: [
          {name: 'id', type: 'integer primary key'},
          {name: 'name', type: 'text'},
          {name: 'type', type: 'text'},
          {name: 'status', type: 'text'},
          {name: 'last_activity', type: 'text'}
        ]
      },
      {
        name: 'log',
        columns: [
          {name: 'id', type: 'integer primary key'},
          {name: 'name', type: 'text'},
          {name: 'event', type: 'text'},
          {name: 'type', type: 'text'},
          {name: 'status', type: 'text'},
          {name: 'last_activity', type: 'text'}
        ]
      },
      {
        name: 'settings',
        columns: [
          {name: 'id', type: 'integer primary key'},
          {name: 'screensaver_time', type: 'integer'},
          {name: 'add_option', type: 'integer'},
          {name: 'alert_email', type: 'text'},
          {name: 'password', type: 'text'},
          {name: 'rights_send_alert', type: 'integer'},
          {name: 'rights_access_settings', type: 'integer'},
          {name: 'rights_add_remove_users', type: 'integer'},
          {name: 'rights_auto_remove_guest', tpye: 'integer'}
        ]
      }
    ]
  }
)

.constant(
  'SS_TIMES', [
    {id: 0,  title:'Off'},
    {id: 1,  title:'1 minute'},
    {id: 2,  title:'2 minutes'},
    {id: 5,  title:'5 minutes'},
    {id: 10, title:'10 minutes'},
])

.constant(
  'ADD_OPTIONS', [
    {id: 0,  title:'Staff And Guests'},
    {id: 1,  title:'Guests Only'}
])

.constant(
  'USER_DEFAULT', {
    'name': "", 'type': 'staff', 'status': 'out'
  }
)

.constant(
  'DEFAULT_ADMIN_TTL', 60
)



.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  .state('tabsController.spacedOutAdd', {
    url: '/add',
    views: {
      'tab1': {
        templateUrl: 'templates/add.html',
        controller: 'spacedOutAddCtrl'
      }
    },
    onEnter: function($state, Settings, Admin){
      Settings.get().then(
        function(settings){
          if(settings.rights_add_remove_users){
            if(!Admin.status.enabled){
              Admin.request(
                "Admin rights are required to add and remove users",
                function(){$state.go('tabsController.spacedOutAdd');}
              );
            }
          }
        }
      );
    }
  })

  .state('tabsController.spacedOut', {
    url: '/roster',
    views: {
      'tab2': {
        templateUrl: 'templates/spacedOut.html',
        controller: 'spacedOutCtrl'
      }
    }
  })

  .state('tabsController.alert', {
    url: '/alert',
    views: {
      'tab3': {
        templateUrl: 'templates/alert.html',
        controller: 'alertCtrl'
      }
    },
    onEnter: function($state, Settings, Admin){
      Settings.get().then(
        function(settings){
          if(settings.rights_send_alert){
            if(!Admin.status.enabled){
              Admin.request(
                "Admin rights are required to send alert email",
                function(){$state.go('tabsController.alert');}
              );
            }
          }
        }
      );
    }
  })

  .state('tabsController.settings', {
    url: '/settings',
    views: {
      'tab4': {
        templateUrl: 'templates/settings.html',
        controller: 'settingsCtrl'
      }
    },
    onEnter: function($state, Settings, Admin){
      Settings.get().then(
        function(settings){
          if(settings.rights_access_settings){
            if(!Admin.status.enabled){
              Admin.request(
                "Admin rights are required to access settings",
                function(){$state.go('tabsController.settings');}
              );
            }
          }
        }
      );
    }
  })

  .state('tabsController', {
    url: '/page1',
    templateUrl: 'templates/tabsController.html',
    abstract:true
  })

  $urlRouterProvider.otherwise('/page1/roster')

});

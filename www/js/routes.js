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
          {name: 'alert_email', type: 'text'},
          {name: 'password', type: 'text'},
          {name: 'rights_send_alert', type: 'integer'},
          {name: 'rights_access_settings', type: 'integer'},
          {name: 'rights_add_staff', type: 'integer'},
          {name: 'rights_remove_staff', type: 'integer'},
          {name: 'rights_add_guest', type: 'integer'},
          {name: 'rights_remove_guest', type: 'integer'}
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
    }
  })

  .state('tabsController.settings', {
    url: '/settings',
    views: {
      'tab4': {
        templateUrl: 'templates/settings.html',
        controller: 'settingsCtrl'
      }
    }
  })

  .state('tabsController', {
    url: '/page1',
    templateUrl: 'templates/tabsController.html',
    abstract:true
  })

  $urlRouterProvider.otherwise('/page1/roster')

});

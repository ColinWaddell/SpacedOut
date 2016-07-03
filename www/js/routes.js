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
      }
    ]
  }
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

  .state('tabsController.settings', {
    url: '/settings',
    views: {
      'tab3': {
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

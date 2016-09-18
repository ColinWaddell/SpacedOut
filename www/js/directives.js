angular.module('app.directives', [])

.directive('hideTabs', function($rootScope) {
  return {
      restrict: 'A',
      link: function($scope, $el) {
          $rootScope.hideTabs = 'tabs-item-hide';
          $scope.$on('$destroy', function() {
              $rootScope.hideTabs = '';
              console.log('destroy');
          });
      }
  };
})

// Need custom directive for ios
.directive('onDoubleClick', function ($timeout) {
  return {
  restrict: 'A',
  link: function ($scope, $elm, $attrs) {
    var clicks = 0;
    var lastClick = new Date();
      $elm.bind('click', function (evt) {
          var dateDiff = new Date() - lastClick;
          if (dateDiff > 300) { // 300 ms
            clicks = 0;
          }
          lastClick = new Date();
          clicks++;
          if (clicks == 1) {
            $timeout(function () {
                if (clicks == 1) {
                    //....
                } else {
                  $scope.$apply(function () {
                    $scope.$eval($attrs.onDoubleClick);
                  });
                }
            }, 300);
          }
      });
    }
  };
})

.directive('scrolly', function ($timeout) {
    return {
        restrict: 'A',
        link: function ($scope, $element, $attrs) {
            var raw = $element[0];
            $element.bind('scroll', function () {
              $scope.$apply(function () {
                $scope.$eval($attrs.scrolly);
              });
            });
        }
    };
});

/* jshint ignore:start */
var gapiLoadingStatus = null;
var handleClientJSLoad = function() {
    gapiLoadingStatus = "loaded";
    console.debug("ClientJS is loaded.");
    //Ready: create a generic event
    var evt = document.createEvent("Events");
    //Aim: initialize it to be the event we want
    evt.initEvent("gapi.loaded", true, true);
    //FIRE!
    window.dispatchEvent(evt);
}
/* jshint ignore:end */

angular.module("risevision.common.gapi", [])
  .factory("gapiLoader", ["$q", "$window", function ($q, $window) {
    var deferred = $q.defer();

    return function () {
      var gapiLoaded;

      if($window.gapiLoadingStatus === "loaded") {
        deferred.resolve($window.gapi);
      }

      else if(!$window.gapiLoadingStatus) {
        $window.gapiLoadingStatus = "loading";

        var src = $window.gapiSrc || "//apis.google.com/js/client.js?onload=handleClientJSLoad";
        var fileref = document.createElement("script");
        fileref.setAttribute("type","text/javascript");
        fileref.setAttribute("src", src);
        if (typeof fileref!=="undefined") {
          document.getElementsByTagName("body")[0].appendChild(fileref);
        }

        gapiLoaded = function () {
          deferred.resolve($window.gapi);
          $window.removeEventListener("gapi.loaded", gapiLoaded, false);
        };
        $window.addEventListener("gapi.loaded", gapiLoaded, false);
      }
      return deferred.promise;
    };
  }])

  //abstract method for creading a loader factory service that loads any
  //custom Google Client API library

  .factory("gapiClientLoaderGenerator", ["$q", "gapiLoader", "$log",
    function ($q, gapiLoader, $log) {
    return function (libName, libVer, baseUrl) {
      return function () {
        var deferred = $q.defer();
        gapiLoader().then(function (gApi) {
          if(gApi.client[libName]){
            //already loaded. return right away
            deferred.resolve(gApi.client[libName]);
          }
          else {
            gApi.client.load.apply(this, [libName, libVer].concat([function () {
              if (gApi.client[libName]) {
                $log.debug(libName + "." + libVer + " Loaded");
                deferred.resolve(gApi.client[libName]);
              } else {
                var errMsg = libName + "." + libVer  + " Load Failed";
                $log.error(errMsg);
                deferred.reject(errMsg);
              }
            }, baseUrl]));
          }
        });
        return deferred.promise;
      };
    };
  }])

  .factory("oauth2APILoader", ["gapiClientLoaderGenerator",
    function(gapiClientLoaderGenerator) {
      return gapiClientLoaderGenerator("oauth2", "v2");
  }])

  .factory("coreAPILoader", ["CORE_URL", "gapiClientLoaderGenerator",
    "$location",
    function (CORE_URL, gapiClientLoaderGenerator, $location) {
      var baseUrl = $location.search().core_api_base_url ? $location.search().core_api_base_url + "/_ah/api": CORE_URL;
      return gapiClientLoaderGenerator("core", "v0", baseUrl);
  }])

  .factory("riseAPILoader", ["CORE_URL", "gapiClientLoaderGenerator", "$location",
    function (CORE_URL, gapiClientLoaderGenerator, $location) {
    var baseUrl = $location.search().core_api_base_url ? $location.search().core_api_base_url + "/_ah/api": CORE_URL;
    return gapiClientLoaderGenerator("rise", "v0", baseUrl);
  }]);

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
    
    var _addScript = function(src) {
      var fileref = document.createElement("script");
      fileref.setAttribute("type","text/javascript");
      fileref.setAttribute("src", src);
      if (typeof fileref!=="undefined") {
        document.getElementsByTagName("body")[0].appendChild(fileref);
      }
    }

    return function () {
      var gapiLoaded;

      if($window.gapiLoadingStatus === "loaded") {
        deferred.resolve($window.gapi);
      }

      else if(!$window.gapiLoadingStatus) {
        $window.gapiLoadingStatus = "loading";

        var src = $window.gapiSrc || "//apis.google.com/js/platform.js?onload=handleClientJSLoad";
        _addScript(src);
        _addScript("//apis.google.com/js/client.js?onload=handleClientJSLoad");

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
  
  .factory("gapiPlatformLoaderGenerator", ["$q", "gapiLoader", "$log",
    function ($q, gapiLoader, $log) {
    return function (libName) {
      var deferred = $q.defer();
      gapiLoader().then(function (gApi) {
        if(gApi[libName]){
          //already loaded. return right away
          deferred.resolve(gApi[libName]);
        }
        else {
          gApi.load(libName, function () {
            if (gApi[libName]) {
              $log.debug(libName + " Loaded");
              
              deferred.resolve(gApi[libName]);
            } else {
              var errMsg = libName + " Load Failed";
              $log.error(errMsg);
              deferred.reject(errMsg);
            }
          });
        }
      });
      return deferred.promise;
    };
  }])

  .factory("auth2APILoader", ["gapiPlatformLoaderGenerator", "$q", "$location",
    function(gapiPlatformLoaderGenerator, $q, $location) {
      var _auth2;
      
      return function(opts) {
        var deferred = $q.defer();
        
        if(_auth2) {
          deferred.resolve(_auth2);
        }
        else {
          gapiPlatformLoaderGenerator("auth2")
            .then(function(auth2) {
              _auth2 = auth2;
              
              auth2.init(opts);
              
              return auth2.getAuthInstance().then();
            })
            .then(function() {
              deferred.resolve(_auth2);
            })
            .then(null, function(e) {
              deferred.reject(e);
            });
        }
        
      return deferred.promise;
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
      return gapiClientLoaderGenerator("core", "v1", baseUrl);
  }])

  .factory("riseAPILoader", ["CORE_URL", "gapiClientLoaderGenerator", "$location",
    function (CORE_URL, gapiClientLoaderGenerator, $location) {
    var baseUrl = $location.search().core_api_base_url ? $location.search().core_api_base_url + "/_ah/api": CORE_URL;
    return gapiClientLoaderGenerator("rise", "v0", baseUrl);
  }])

  .factory("storeAPILoader", ["STORE_ENDPOINT_URL", "gapiClientLoaderGenerator", "$location",
    function (STORE_ENDPOINT_URL, gapiClientLoaderGenerator, $location) {
    var baseUrl = $location.search().store_api_base_url ? $location.search().store_api_base_url + "/_ah/api": STORE_ENDPOINT_URL;
    return gapiClientLoaderGenerator("store", "v0.01", baseUrl);
  }])

  .factory("discoveryAPILoader", ["CORE_URL", "gapiClientLoaderGenerator", "$location",
    function (CORE_URL, gapiClientLoaderGenerator, $location) {
        var baseUrl = $location.search().core_api_base_url ? $location.search().core_api_base_url + "/_ah/api": CORE_URL;
        return gapiClientLoaderGenerator("discovery", "v1", baseUrl);
  }])

  .factory("monitoringAPILoader", ["MONITORING_SERVICE_URL", "gapiClientLoaderGenerator", "$location",
    function (MONITORING_SERVICE_URL, gapiClientLoaderGenerator, $location) {
      var baseUrl = $location.search().core_api_base_url ? $location.search().core_api_base_url + "/_ah/api": MONITORING_SERVICE_URL;
      return gapiClientLoaderGenerator("monitoring", "v0", baseUrl);
  }]);

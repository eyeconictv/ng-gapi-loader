window.gapi = window.gapi || {};

window.gapi.client = {
  load: function(path, version, cb) {
    window.gapi.client[path] = {version: version};
    cb();
  }
};

window.handleClientJSLoad();

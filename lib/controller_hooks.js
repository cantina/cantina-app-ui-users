var app = require('cantina');

module.exports = function (controller, opts) {
  Object.keys(opts).forEach(function (method) {
    var paths = opts[method];
    paths.forEach(function (path) {
      controller[method](path, function (req, res, next) {
        app.hook(method + ':' + path).runSeries(req, res, function (err) {
          if (err) return res.renderError(err);
          next();
        });
      });
    });
  });
}
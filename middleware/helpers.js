var app = require('cantina');

module.exports = function (req, res, next) {

  /**
   * This might be better suited as general
   * cantina-app-ui stuff rather than user specific
   */

  // Log an error and respond to user with a 500.
  res.renderError = function (err) {
    app.emit('error', err.stack || err);
    res.statusCode = 500;
    res.renderStatus(500, res.vars);
  };

  // Set messages on the response.
  res.setMessage = function(message, type) {
    type = type || 'warning';
    req.session.messages || (req.session.messages = {});
    req.session.messages[type] || (req.session.messages[type] = []);
    req.session.messages[type].push(message);
  };

  // Set errors on form elements.
  var formErrors = res.formErrors || {};
  res.formError = function(name, message) {
    res.setMessage(message, 'error');
    formErrors[name] = message;
    res.formErrors = res.vars.formErrors = formErrors;
  };

  // Messages are stored in session for redirect persistence.
  if (req.session && req.session.messages) {
    res.vars.messages = req.session.messages;
    delete req.session.messages;
  }

  var _render = res.render;
  res.render = function (template, context, options) {
    app.hook('controller:before:render:' + template).runSeries(req, res, context, options, function (err) {
      if (err) return app.emit('error', err);
      _render(template, context, options);
    });
  };
  next();

};
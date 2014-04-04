
module.exports = function (req, res, next) {

  // Log an error and respond to user with a 500.
  res.renderError = function (err) {
    console.error(err.stack || err);
    res.statusCode = 500;
    res.vars.noScripts = true;
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
  next();

};
var app = require('cantina')
  , controller = module.exports = app.controller();

controller.get(['/'], function index (req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  res.render('home', res.vars);
});

app.hook('controller:before:render:users/register').add(function (req, res, context, options, next) {
  context.formFields || (context.formFields = []);
  context.formFields.push({
    template: 'partials/registerFields'
  });
  next();
});

app.hook('controller:form:validate:register').add(function (req, res, next) {
  if (!res.vars.values.organization) {
    res.formError('organization', 'Organization is required.');
  }
  if (!res.vars.values.title) {
    res.formError('title', 'Title is required.');
  }
  next();
});
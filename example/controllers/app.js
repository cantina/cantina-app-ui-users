var app = require('cantina')
  , controller = module.exports = app.controller();

controller.get(['/'], function index (req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  res.render('home', res.vars);
});
app.hook('get:/register').add(250, templateVars);
app.hook('post:/register').add(250, validate);
app.hook('post:/register').add(350, templateVars);

function templateVars (req, res, next) {
  res.vars.formFields || (res.vars.formFields = []);
  res.vars.formFields.push({
    template: 'partials/registerFields'
  });
  next && next();
}

function validate (req, res, next) {
  if (!res.vars.values.organization) {
    res.formError('organization', 'Organization is required.');
  }
  if (!res.vars.values.title) {
    res.formError('title', 'Title is required.');
  }
  if (res.formErrors) {
    res.vars.noScripts = true;
    res.vars.loginErrors = true;
    templateVars(req, res);
    return res.render('users/register', res.vars);
  }
  next();
}
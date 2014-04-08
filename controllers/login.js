var app = require('cantina')
  , controller = module.exports = app.controller()
  , controllerHooks = require('../lib/controller_hooks');

controllerHooks(controller, {
  get: ['/login'],
  post: ['/login']
});

app.hook('get:/login').add(100, loggedInRedirect);
app.hook('get:/login').add(200, values);
app.hook('get:/login').add(300, login);

app.hook('post:/login').add(100, loggedInRedirect);
app.hook('post:/login').add(200, values);
app.hook('post:/login').add(300, processLogin);
app.hook('post:/login').add(400, login);

function loggedInRedirect (req, res, next) {
  if (req.user) {
    return res.redirect('/');
  }
  next();
}

function values (req, res, next) {
  res.vars.values = req.body || {};
  res.vars.query = req.query || {};
  next();
}

function login (req, res, next) {
  res.vars.title = res.vars.title || 'Login or Request an Account';
  res.vars.noScripts = true;
  if (res.formErrors) {
    res.vars.loginErrors = true;
  }
  res.render('users/login', res.vars);
}

function processLogin (req, res, next) {
  if (!req.body) {
    return next(new Error('Invalid post data'));
  }
  if (!req.body.email || !req.body.pass) {
    res.formError('login', 'Email and password are both required.');
  }
  if (res.formErrors) {
    return next();
  }

  app.users.authenticate(req.body.email.trim(), req.body.pass, req, res, function (err) {
    if (err) {
      res.formError('login', err.message);
      return next();
    }
    var redirectUrl = req.session.redirectUrl || '/';
    // Clean-up the session, if necessary
    req.session.redirectUrl && delete req.session.redirectUrl;
    res.redirect(redirectUrl);
  });
}

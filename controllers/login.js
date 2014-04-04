var app = require('cantina')
  , controller = module.exports = app.controller();

controller.get('/login', [loggedInRedirect, values, login]);
controller.post('/login', [loggedInRedirect, values, processLogin, login]);

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

  app.collections.users.find({email: req.body.email.trim()}, function (err, user) {
    if (err) return res.renderError(err);
    if (user) {
      if (app.users.checkPassword(req.body.pass, user._values.auth)){
        app.auth.logIn(user, req, res, function (err) {
          if (err) return res.renderError(err);
          var redirectUrl = req.session.redirectUrl || '/';
          // Clean-up the session, if necessary
          req.session.redirectUrl && delete req.session.redirectUrl;
          res.redirect(redirectUrl);
        });
      }
      else {
        res.formError('login', 'Invalid email/password combination.');
        next();
      }
    }
    else {
      // invalid credentials
      res.formError('email', 'The email address was not found.');
      next();
    }
  });
}


var app = require('cantina')
  , controller = module.exports = app.controller()
  , loginPath = app.conf.get('auth:loginPath') || '/login';

app.conf.add({
  app: {
    ui: {
      users: {
        login: {
          enabled: true
        }
      }
    }
  }
});
var conf = app.conf.get('app:ui:users:login');
if (!conf.enabled) {
  return;
}

controller.get(loginPath, [loggedInRedirect, values, login]);
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

  app.hook('controller:form:validate:login').runSeries(req, res, function (err) {
    if (err) return res.renderError(err);
    if (res.formErrors) {
      return next();
    }

    app.collections.users.findByAuth(req.body.email.trim(), req.body.pass, function (err, user) {
      if (err) {
        res.renderError(err);
      }
      else if (!user) {
        res.formError('login', 'Invalid email/password combination.');
        return next();
      }
      app.auth.logIn(user, req, res, function (err) {
        var redirectUrl = req.session.redirectUrl || '/';
        // Clean-up the session, if necessary
        req.session.redirectUrl && delete req.session.redirectUrl;
        res.redirect(redirectUrl);
      });
    });
  });
}


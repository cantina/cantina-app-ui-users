var app = require('cantina')
  , _ = require('underscore')
  , controller = module.exports = app.controller();

require('cantina-tokens');
require('cantina-email');

function values (req, res, next) {
  res.vars.values = req.body || {};
  next();
}

controller.add('/account-confirm*', values);
controller.get('/account-confirm/:token', [loadToken, page]);
controller.post('/account-confirm/:token', [loadToken, process, page]);
controller.post('/account-confirm/resend', resend);

controller.on('error', function (err, req, res) {
  res.renderError(err);
});

function loadToken (req, res, next) {
  if (req.user) {
    res.vars.error = 'Could not activate account. You are already logged in as another user.';
    return next();
  }

  app.tokens.check(req.params.token, 'account', function (err, userId) {
    if (err) return next(err);
    if (userId) {
      app.collections.users.load(userId, function (err, user) {
        if (err) return next(err);
        if (user) {
          if (user.status === 'deleted') {
            res.vars.error = 'Your account has been deleted.';
            return next();
          }
          else if (req.user && user.id !== req.user.id) {
            res.vars.error = 'You are already logged in with a different account. Please log out, re-send the activation email, and try again.';
            return next();
          }
          app.users.sanitize(user);
          res.vars.user = user;
          res.vars.values = _.extend({}, user, res.vars.values);
          next();
        }
        else {
          res.vars.error = 'The link you followed is invalid or expired.';
          return next();
        }
      });
    }
    else {
      res.vars.error = 'The link you followed is invalid or expired.';
      return next();
    }
  });
}

function process (req, res, next) {

  var user = res.vars.user;
  delete res.vars.user;

  var minPasswordLen = app.conf.get('users-ui:password_min_length') || 5;

  if (!req.body) {
    return next(new Error('Invalid post data'));
  }
  if (!req.body.pass) {
    res.formError('pass', 'Password is required.');
  }
  else if (req.body.pass.length < minPasswordLen) {
    res.formError('pass', 'Password must be at least ' + minPasswordLen + ' characters long.');
  }
  else if (!req.body.pass2) {
    res.formError('pass2', 'Password confirmation required.');
  }
  else if (req.body.pass !== req.body.pass2) {
    res.formError('pass2', 'Password confirmation was not entered correctly.');
  }

  app.hook('controller:form:validate:account-confirm').runSeries(req, res, function (err) {
    if (err) return res.renderError(err);
    if (res.formErrors) {
      return next();
    }
    user.status = 'active';
    app.users.setPassword(user, req.body.pass, function (err) {
      if (err) return res.renderError(err);
      var userVars = _.pick(req.body, Object.keys(app.schemas.user.properties));
      user = _.extend(user, userVars);
      app.collections.users.save(user, function (err) {

        //todo - db agnostic error handling
        if (err && err.code === 'ER_DUP_ENTRY') {
          if (err.message.match(/for key 'username'$/)){
            res.formError('username', 'Username already registered.');
          }
          return next();
        }

        if (err) return next(err);
        delete res.vars.values;
        app.tokens.delete(req.params.token, 'account', function (err) {
          app.auth.logIn(user, req, res, function (err) {
            if (err) return res.renderError(err);
            res.setMessage('Thank you for completing your registration. Your account is now active.', 'success');
            res.redirect('/');
          });
        });
      });
    });
  });
}

function page (req, res, next) {
  if (res.vars.error) {
    res.statusCode = 400;
    res.vars.noScripts = true;
    res.vars.message = res.vars.error;
    return res.renderStatus(400, res.vars);
  }
  delete res.vars.user;
  res.vars.title = 'Activate account';
  res.vars.noScripts = true;
  res.render('users/account_confirm', res.vars);
}

function resend (req, res, next) {
  if (!req.user) {
    res.statusCode = 401;
    res.vars.noScripts = true;
    return res.renderStatus(401, res.vars);
  }
  app.email.send('users/account_confirm', { user: req.user }, function (err) {
    if (err) {
      app.emit('error', err);
      res.json({
        status: 'error',
        error: 'Error re-sending confirmation email. Please try again.'
      });
    }
    else {
      res.json({
        status: 'ok',
        message: 'Confirmation email re-sent.'
      });
    }
  });
}
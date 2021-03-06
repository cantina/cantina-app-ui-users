module.exports = function (app) {
  var controller = app.controller()
    , conf = app.conf.get('app:ui:users');

  if (!conf.forgot.enabled) {
    return;
  }

  app.require('cantina-tokens');
  app.require('cantina-email');

  controller.add(conf.forgot.route + '*', [loggedInCheck, values]);
  controller.get(conf.forgot.route, forgot);
  controller.post(conf.forgot.route, [processForgot, forgot]);
  controller.get(conf.forgot.route + '/:token', [loadToken, resetForm]);
  controller.post(conf.forgot.route + '/:token', [loadToken, processReset, resetForm]);

  function loggedInCheck (req, res, next) {
    if (req.user) {
      res.vars.error = 'You are already logged in. You can only reset your password if you are logged out.';
      return next();
    }
    next();
  }

  function values (req, res, next) {
    res.vars.values = req.body || {};
    next();
  }

  function forgot (req, res, next) {
    if (res.vars.error) {
      res.statusCode = 400;
      res.vars.noScripts = true;
      res.vars.message = res.vars.error;
      return res.renderStatus(400, res.vars);
    }
    res.vars.title = 'Forgot your password?';
    res.vars.noScripts = true;
    res.render('users/forgot', res.vars);
  }

  function processForgot (req, res, next) {
    if (res.vars.error) return next();
    if (!req.body.email) {
      res.formError('email', 'Please enter your email address.');
      return next();
    }
    app.hook('controller:form:validate:forgot').runSeries(req, res, function (err) {
      if (err) return res.renderError(err);

      app.collections.users.load({email_lc: req.body.email.trim()}, function (err, user) {
        if (err) return res.renderError(err);
        if (!user) {
          res.formError('email', 'Email address not found.');
          return next();
        }
        app.email.send('users/password_reset', { user: user }, function (err) {
          if (err) return res.renderError(err);
          res.vars.success = 'Please check your email for further instructions.';
          next();
        });
      });
    });
  }

  function loadToken (req, res, next) {
    if (res.vars.error) return next();
    app.tokens.check(req.params.token, 'password-reset', function (err, userId) {
      if (err) return res.renderError(err);
      if (userId) {
        app.collections.users.load(userId, function (err, user) {
          if (err) return res.renderError(err);
          if (user) {
            if (req.user && user.id !== req.user.id) {
              res.vars.error = 'You may not reset another user\'s password.';
              return next();
            }
            res.vars.user = user;
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

  function processReset (req, res, next) {
    if (res.vars.error) return next();

    if (!req.body.pass) {
      res.formError('pass', 'Password is required.');
    }
    else if (req.body.pass.length < conf.passwordMinLength) {
      res.formError('pass', 'Password must be at least ' + conf.passwordMinLength + ' characters long.');
    }
    else if (!req.body.pass2) {
      res.formError('pass2', 'Password confirmation required.');
    }
    else if (req.body.pass !== req.body.pass2) {
      res.formError('pass2', 'Password confirmation was not entered correctly.');
    }

    app.hook('controller:form:validate:forgot-reset').runSeries(req, res, function (err) {
      if (err) return res.renderError(err);
      if (res.formErrors) {
        return next();
      }

      app.auth.setPassword(res.vars.user, req.body.pass, function (err) {
        if (err) return res.renderError(err);
        app.collections.users._update({id: res.vars.user.id}, {$set: {auth: res.vars.user.auth}}, function (err) {
          if (err) return res.renderError(err);
          delete res.vars.values;
          app.tokens.delete(req.params.token, 'password-reset', function (err) {
            if (err) return res.renderError(err);
            app.auth.logIn(res.vars.user, req, res, function (err) {
              if (err) return res.renderError(err);
              res.setMessage('Your password has been reset, and you are now logged in.', 'success');
              res.redirect('/');
            });
          });
        });
      });
    });
  }

  function resetForm (req, res, next) {
    if (res.vars.error) {
      res.statusCode = 400;
      res.vars.noScripts = true;
      res.vars.message = res.vars.error;
      return res.renderStatus(400, res.vars);
    }
    delete res.vars.user;
    res.vars.title = 'Reset password';
    res.vars.noScripts = true;
    res.render('users/forgot-reset', res.vars);
  }

  return controller;
};

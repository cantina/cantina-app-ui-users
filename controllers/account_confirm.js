var _ = require('underscore');

module.exports = function (app) {
  var controller = app.controller();

  app.require('cantina-tokens');
  app.require('cantina-email');

  var conf = app.conf.get('app:ui:users');
  if (!conf.account_confirm.enabled) {
    return;
  }

  function values (req, res, next) {
    res.vars.values = req.body || {};
    next();
  }

  controller.add(conf.account_confirm.route + '*', values);
  controller.get(conf.account_confirm.route + '/:token', [loadToken, page]);
  controller.post(conf.account_confirm.route + '/:token', [loadToken, processConfirm, page]);
  controller.post(conf.account_confirm.resendRoute, resend);

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

  function processConfirm (req, res, next) {

    var user = res.vars.user;
    delete res.vars.user;

    if (!req.body) {
      return next(new Error('Invalid post data'));
    }
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

    app.hook('controller:form:validate:account-confirm').runSeries(req, res, function (err) {
      if (err) return res.renderError(err);
      if (res.formErrors) {
        return next();
      }
      user.status = 'active';
      app.auth.setPassword(user, req.body.pass, function (err) {
        if (err) return res.renderError(err);
        app.collections.users._update({id: user.id}, {$set: {auth: user.auth}}, function (err) {
          if (err) return res.renderError(err);
          user = _.extend(user, req.body);
          app.collections.users.save(user, function (err) {

            // TODO: - db agnostic error handling
            if (err && err.toString().match(/duplicate key error/)) {
              if (err.toString().match(/username_lc/)){
                res.formError('username', 'Username already registered.');
              }
              return next();
            }

            if (err) return next(err);
            delete res.vars.values;
            app.tokens.delete(req.params.token, 'account', function (err) {
              if (err) return res.renderError(err);
              app.auth.logIn(user, req, res, function (err) {
                if (err) return res.renderError(err);
                res.setMessage('Thank you for completing your registration. Your account is now active.', 'success');
                res.redirect('/');
              });
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

  return controller;
};

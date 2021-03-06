var _ = require('underscore');

module.exports = function (app) {
  var controller = app.controller()
    , conf = app.conf.get('app:ui:users:register');

  if (!conf.enabled) {
    return;
  }
  app.require('cantina-email');

  controller.get(conf.route, [loggedInRedirect, values, register]);
  controller.post(conf.route, [loggedInRedirect, values, processRequest, register]);
  controller.get(conf.redirect, [loggedInRedirect, registered]);

  function loggedInRedirect (req, res, next) {
    if (req.user) {
      return res.redirect('/');
    }
    next();
  }

  function values (req, res, next) {
    res.vars.values = req.body || {};
    res.vars.query = req.query || {};
    res.vars.approvalRequired = app.conf.get('app-ui-users:require_account_approval');
    next();
  }

  function register (req, res, next) {
    res.vars.title = res.vars.title || 'Request an Account';
    res.vars.noScripts = true;
    if (res.formErrors) {
      res.vars.loginErrors = true;
    }
    res.render('users/register', res.vars);
  }

  function processRequest (req, res, next) {
    if (!req.body) {
      return next(new Error('Invalid post data'));
    }
    if (!req.body.email) {
      res.formError('email', 'Email is required.');
    }
    else if (!app.validators.isEmail(req.body.email)) {
      res.formError('email', 'Invalid email address.');
    }
    if (!req.body.firstname) {
      res.formError('firstname', 'First Name is required.');
    }
    if (!req.body.lastname) {
      res.formError('lastname', 'Last Name is required.');
    }
    app.hook('controller:form:validate:register').runSeries(req, res, function (err) {
      if (err) return res.renderError(err);
      if (res.formErrors) {
        res.vars.noLogin = true;
        res.vars.title = 'Request an Account';
        return next();
      }
      createAccountRequest(req, res, next);
    });
  }

  function createAccountRequest (req, res, next) {
    app.collections.users.load({email_lc: req.body.email.toLowerCase(), status: 'invited'}, function (err, invitedUser) {
      if (err) return next(err);
      if (invitedUser) {
        app.email.send('users/account_confirm', {user: invitedUser}, function (err) {
          if (err) app.emit('error', err);
        });
        res.setMessage(["A follow-up email will be sent to the address you provided for account activation."]
          .join(' '), 'success');
        res.redirect(conf.redirect);
      }
      else {
        if (app.conf.get('app-ui-users:require_account_approval')) {
          req.body.status  || (req.body.status = 'requested');
        }
        else {
          req.body.status || (req.body.status = 'unconfirmed');
        }
        req.body.name = {
          first: req.body.firstname,
          last: req.body.lastname
        };
        var user = app.collections.users.create(req.body);
        app.collections.users.save(user, function (err) {

          // TODO: - db agnostic error handling
          if (err && err.toString().match(/duplicate key error/) && err.toString().match(/email_lc/)){
            res.formError('email', 'Email already registered.');
            return next();
          }
          else if (err) {
            return res.renderError(err);
          }
          if (user.status === 'requested') {
            res.setMessage([ "A follow-up email will be sent to the address you provided pending account approval."]
              .join(' '), 'success');
            res.redirect(conf.redirect);
          }
          else {
            app.email.send('users/account_confirm', {user: user}, function (err) {
              if (err) app.emit('error', err);
            });
            res.setMessage(["A follow-up email will be sent to the address you provided for account activation."]
              .join(' '), 'success');
            res.redirect(conf.redirect);
          }
        });
      }
    });
  }

  function registered (req, res, next) {
    if (!res.vars.messages) {
      return res.redirect('/login');
    }
    res.vars.msg = res.vars.messages.success && res.vars.messages.success.pop();
    res.vars.noScripts = true;
    res.vars.noLogin = true;
    res.vars.postRequest = true;
    res.render('users/register', res.vars);
  }

  return controller;
};


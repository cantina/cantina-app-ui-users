var app = require('cantina')
  , _ = require('underscore')
  , controller = module.exports = app.controller()
  , registerRedirectPath = app.conf.get('users-ui:registerRedirect') || '/registered';

require('cantina-email');

controller.get('/register', [loggedInRedirect, values, register]);
controller.post('/register', [loggedInRedirect, values, processRequest, register]);
controller.get('/registered', [loggedInRedirect, registered]);


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
  app.collections.users.findOne({email: req.body.email, status: 'invited'}, function (err, invitedUser) {
    if (err) return next(err);
    if (invitedUser) {
      app.users.sanitize(invitedUser);
      app.email.send('users/account_confirm', {user: invitedUser}, function (err) {
        if (err) app.emit('error', err);
      });
      res.setMessage(["A follow-up email will be sent to the address you provided for account activation."]
        .join(' '), 'success');
      res.redirect(registerRedirectPath);
    }
    else {
      var userVars = _.pick(req.body, Object.keys(app.schemas.user.properties));
      if (app.conf.get('users-ui:require_account_approval')) {
        userVars.status  || (userVars.status = 'requested');
      }
      else {
        userVars.status || (userVars.status = 'unconfirmed');
      }
      userVars.name = {
        first: req.body.firstname,
        last: req.body.lastname
      };
      userVars.username || (userVars.username = userVars.name.first + userVars.name.last);
      var user = app.collections.users.create(userVars);
      app.collections.users.save(user, function (err) {
        if (err && err.type !== 'duplicate') {
          return next(err);
        }

        if (user.status === 'requested') {
          res.setMessage([ "A follow-up email will be sent to the address you provided pending account approval."]
            .join(' '), 'success');
          res.redirect(registerRedirectPath);
        }
        else {
          app.users.sanitize(user);
          app.email.send('users/account_confirm', {user: user}, function (err) {
            if (err) app.emit('error', err);
          });
          res.setMessage(["A follow-up email will be sent to the address you provided for account activation."]
            .join(' '), 'success');
          res.redirect(registerRedirectPath);
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

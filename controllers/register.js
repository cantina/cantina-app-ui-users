var app = require('cantina')
  , _ = require('underscore')
  , controller = module.exports = app.controller()
  , controllerHooks = require('../lib/controller_hooks');

controllerHooks(controller, {
  get: ['/register', '/registered'],
  post: ['/register']
});

app.hook('get:/register').add(100, loggedInRedirect);
app.hook('get:/register').add(200, values);
app.hook('get:/register').add(300, register);

app.hook('post:/register').add(100, loggedInRedirect);
app.hook('post:/register').add(200, values);
app.hook('post:/register').add(300, processRequest);
app.hook('post:/register').add(400, register);

app.hook('get:/registered').add(100, loggedInRedirect);
app.hook('get:/registered').add(200, registered);


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
  if (res.formErrors) {
    res.vars.noLogin = true;
    res.vars.title = 'Request an Account';
    return next();
  }
  createAccountRequest(req, res, next);
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
      res.redirect('/registered');
    }
    else {
      var userVars = _.pick(req.body, Object.keys(app.schemas.user.properties));
      userVars.status  || (userVars.status = 'disabled');
      userVars.name = {
        first: req.body.first_name,
        last: req.body.last_name
      };
      userVars.username || (userVars.username = userVars.name.first + userVars.name.last);
      var user = app.collections.users.create(userVars);
      app.collections.users.save(user, function (err) {
        if (err && err.type !== 'duplicate') {
          return next(err);
        }
        // For security reasons, we're not going to be too specific here.
        // So, the user will get redirected to the "success" page when:
        // (a) a new account_request was created;
        // (b) a new account_request was not created because the email matches
        //     an existing account_request; or
        // (c) a new account_request was not created because the email matches
        //     an existing user.
        else {
          res.setMessage([ "A follow-up email will be sent to the address you provided pending account approval."]
            .join(' '), 'success');
          res.redirect('/registered');
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

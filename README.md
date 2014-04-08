cantina-app-users-ui
====================

Drop-in UI for cantina-app-users

Provides
--------

###Login

- **route:** `/login`
- **template** `users/login`

###Logout

- **route:** `/logout`
- **template:** *none*

###Password Reset Request

- **route:** `/forgot`
- **template:** `users/forgot`

###Password Reset Form

- **route:** `/forgot/:token`
- **template:** `users/forgot-reset`

###Register

- **route:** `/register`, `/registered`
- **template:** `users/register`

###Activate

- **route:** `/activate/:token`, `/activate/resend`
- **template:** `users/activate`

Usage
------
Just include cantina-app-users-ui in your main app file and start using the
default UI.

You can optionally extend the UI implementation by adding your own templates
to override the above, adding form field partials, and adding controller hooks
to change the default behavior

Example
-------
```js
var app = require('cantina');

app.boot(function (err) {
  if (err) throw err;

  require('cantina-web');
  require('cantina-app-users-ui');
  require('cantina-validators');
  require('cantina-email');

  app.start();
});
```

```js
var app = require('cantina')
  , controller = module.exports = app.controller();

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
```

```hbs
<div class="form-group {{#if formErrors.organization}} error{{/if}} organization">
  <input name="organization" type="text" autocomplete="off" id="organization-register" placeholder="Organization" class="form-control" value="{{values.organization}}">
  {{#if formErrors.organization}}<span class="help-block">{{formErrors.organization}}</span>{{/if}}
</div>
<div class="form-group {{#if formErrors.title}} error{{/if}} title">
  <input name="title" type="text" autocomplete="off" id="title-register" placeholder="Title" class="form-control" value="{{values.title}}">
  {{#if formErrors.title}}<span class="help-block">{{formErrors.title}}</span>{{/if}}
</div>
```
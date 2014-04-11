cantina-app-ui-users
====================

Drop-in UI for cantina-app-users

Usage
------
Just include cantina-app-ui-users in your main app file and start using the
default UI.

You can optionally extend the UI implementation by adding your own templates
to override the above, adding form field partials, and adding hooks
to change the default controller behavior

Example
-------
```js
var app = require('cantina');

app.boot(function (err) {
  if (err) throw err;

  require('cantina-web');
  require('cantina-app-ui-users');

  app.start();
});
```

```js
var app = require('cantina');

app.hook('controller:before:render:users/register').add(function (req, res, context, options, next) {
  context.formFields || (context.formFields = []);
  context.formFields.push({
    template: 'partials/users/registerFields'
  });
  next();
});

app.hook('controller:form:validate:register').add(function (req, res, next) {
  if (!res.vars.values.organization) {
    res.formError('organization', 'Organization is required.');
  }
  if (!res.vars.values.title) {
    res.formError('title', 'Title is required.');
  }
  next();
});
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

Provides
--------

###Hooks

####`controller:before:render:[template](res, res, context, options)`

Runs before a template gets rendered. Allows app or plugins to hook in and
modify vars or prevent the render.

####`controller:form:validate:[endpoint](req, res)`

Runs at the time of form validation for each controller. Allows app or plugins
to hook in and add own validation to submitted form.

###Endpoints

####Login

- **route:** `/login`
- **template** `users/login`

####Logout

- **route:** `/logout`
- **template:** *none*

####Password Reset Request

- **route:** `/forgot`
- **template:** `users/forgot`

####Password Reset Form

- **route:** `/forgot/:token`
- **template:** `users/forgot-reset`

####Register

- **route:** `/register`, `/registered`
- **template:** `users/register`

####Activate

- **route:** `/account-confirm/:token`, `/account-confirm/resend`
- **template:** `users/account_confirm`

####Administrate Users

- **route:** `/admin/users`
- **template:** `users/administrate_users`, `users/partials/user`

###Partials

#### `users/partials/extraFields`

Applies an additional partial to each of the above forms, allowing the app or
plugin to extend forms. Just include an array of template paths on
`res.formFields` and they will be appended to the default forms.
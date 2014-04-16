var app = require('cantina')
  , controller = module.exports = app.controller();

app.conf.add({
  app: {
    ui: {
      users: {
        admin: {
          route: '/admin/users',
          enabled: true,
          permission: {
            context: 'site',
            action: 'administrate users'
          }
        }
      }
    }
  }
});

var conf = app.conf.get('app:ui:users:admin');
if (!conf.enabled) {
  return;
}
require('cantina-permissions');

controller.get(conf.route, [authRedirect, loadUsers, page]);
controller.post(conf.route, [authRedirect, modifyUser, loadUsers, page]);


function authRedirect (req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/');
  }
  app.permissions[conf.permission.context].can(conf.permission.action, req.user, function (err, can) {
    if (err) return res.renderError(err);
    if (!can) {
      return res.redirect('/');
    }
    res.vars.admin = true;
    res.vars.postPath = conf.route;
    next();
  });
}

function loadUsers (req, res, next) {
  app.collections.users.list({}, function (err, users) {
    if (err) return res.renderError(err);
    res.vars.users = users.map(function (user) {
      return app.users.sanitize(user);
    });
    next();
  });
}

function modifyUser (req, res, next) {
  if (!req.body.user_id || !req.body.status) {
    return res.renderStatus(400);
  }
  else {
    app.collections.users.load(req.body.user_id, function (err, user) {
      if (err) return res.renderError(err);
      if (user) {
        user.status = req.body.status;
        app.collections.users.save(user, function (err) {
          if (err) return res.renderError(err);
          next();
        });
      }
      else {
        return res.renderStatus(404);
      }
    });
  }
}

function page (req, res, next) {
  res.vars.title = res.vars.title || 'Administrate Users';
  res.render('users/administrate_users', res.vars);
}
module.exports = function (app) {
  var controller = app.controller()
    , conf = app.conf.get('app:ui:users:logout')
    , sessionConf = app.conf.get('session') || {}
    , resetCookie = sessionConf.cookie ? require('util').format('%s=null; path=%s; expires=Thu, 01 Jan 1970 00:00:00 GMT%s', sessionConf.key, sessionConf.cookie.path, (sessionConf.cookie.httpOnly ? '; HttpOnly' : '')) : undefined
    , logoutPath = app.conf.get('auth:logoutPath') || '/logout'
    , loginPath = app.conf.get('auth:loginPath') || '/login';

  if (!conf.enabled) {
    return;
  }

  app.middleware.remove(logoutPath);
  controller.get(logoutPath, function (req, res, next) {
    app.auth.logOut(req, function (err) {
      if (err) return res.renderError(err);
      if (req.query.redirectTo) {
        req.session.redirectUrl = req.query.redirectTo;
      }
      if (resetCookie) {
        res.header('Set-Cookie', resetCookie);
      }
      res.redirect(loginPath);
    });
  });

  return controller;
};

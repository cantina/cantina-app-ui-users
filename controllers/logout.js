var app = require('cantina')
  , controller = module.exports = app.controller();

var sessionConf = app.conf.get('session') || {}
  , resetCookie = sessionConf.cookie ? require('util').format('%s=null; path=%s; expires=Thu, 01 Jan 1970 00:00:00 GMT%s', sessionConf.key, sessionConf.cookie.path, (sessionConf.cookie.httpOnly ? '; HttpOnly' : '')) : undefined;

app.middleware.remove('/logout');
controller.get('/logout', function (req, res, next) {
  app.auth.logOut(req, function (err) {
    if (err) return res.renderError(err);
    if (req.query.redirectTo) {
      req.session.redirectUrl = req.query.redirectTo;
    }
    if (resetCookie) {
      res.header('Set-Cookie', resetCookie);
    }
    res.redirect('/login');
  });
});
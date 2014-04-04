var app = require('cantina')
  , controller = module.exports = app.controller();

controller.get(['/'], function index (req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  res.render('home', res.vars);
});

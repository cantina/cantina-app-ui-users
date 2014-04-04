var app = require('cantina');

app.boot(function (err) {
  if (err) throw err;

  require('cantina-web');
  require('cantina-app-users');
  require('../');

  app.start();
});

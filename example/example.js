var app = require('cantina');

app.boot(function (err) {
  if (err) throw err;

  require('cantina-web');
  require('cantina-app-users');
  require('cantina-validators');
  require('cantina-email');
  require('../');

  // Error handler.
  app.on('error', function (err) {
    if (err.stack) {
      app.log.error(err.stack);
    }
    else {
      app.log.error(err);
    }
  });

  app.start();
});

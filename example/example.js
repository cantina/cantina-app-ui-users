var app = require('cantina').createApp();

app.boot(function (err) {
  if (err) throw err;

  app.require('cantina-web');
  app.require('cantina-app-users');
  app.require('../');

  app.load('web');

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

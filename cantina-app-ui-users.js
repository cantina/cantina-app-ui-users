module.exports = function (app) {
  app.require('cantina-app-users');

  app.load('conf');
  app.load('plugins');
  app.load('middleware');
  app.load('controllers');
  app.load('views');
};

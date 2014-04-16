var app = require('cantina');

if (!app.users) require('cantina-app-users');
app.load('plugins', __dirname);
app.loadMiddleware('middleware', __dirname);
app.loadControllers('controllers', __dirname);
app.loadViews('views', __dirname);

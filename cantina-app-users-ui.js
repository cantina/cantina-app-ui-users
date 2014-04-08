var app = require('cantina');

require('./plugins/handlebars');
app.loadMiddleware('middleware', __dirname);
app.loadControllers('controllers', __dirname);
app.loadViews('views', __dirname);

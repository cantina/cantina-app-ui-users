var app = require('cantina')
  , path = require('path');

app.loadMiddleware('middleware', __dirname);
app.loadControllers('controllers', __dirname);
app.loadViews('views', __dirname);

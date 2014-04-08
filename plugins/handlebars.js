var app = require('cantina');

app.Handlebars.registerHelper('applyPartial', function (template, vars) {
  var template = app.Handlebars.partials[template];
  if (!template) {
    throw new Error('Handlebars partial ' + template + ' could not be found.');
  }
  return template(vars);
});


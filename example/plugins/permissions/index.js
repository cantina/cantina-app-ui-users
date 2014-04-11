var app = require('cantina');

require('cantina-permissions');

app.permissions.define('site', {
  admin: ['administrate users']
});


app.hook('start').last(function (done) {
  app.collections.users.findOne({email_lc: app.conf.get('app:users:admin:attributes:email')}, function (err, admin) {
    if (err) return done(err);
    if (!admin) {
      return done();
    }
    app.permissions.site.grant('admin', admin, done);
  });
});
var app = require('cantina');

require('cantina-permissions');

app.permissions.define('users', {
  admin: ['administrate']
});


app.hook('start').last(function (done) {
  app.collections.users.findOne({email_lc: app.conf.get('app:users:admin:attributes:email')}, function (err, admin) {
    if (err) return done(err);
    if (!admin) {
      return done();
    }
    app.permissions.users.grant('admin', admin, done);
  });
});
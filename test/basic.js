describe('basic', function () {
  var proc;

  before(function (done) {
    proc = spawn('node', ['example.js'], {cwd: example});
    process.on('exit', function () {
      proc.kill();
    });
    proc.stdout.on('data', function (data) {
      assert.equal(data.toString(), 'Listening on 0.0.0.0:3000\n');
      done();
    });
  });

  after(function () {
    if (proc) proc.kill();
  });

  it('can extend a default form by adding fields', function (done) {
    request('http://localhost:3000/register', function (err, res, body) {
      assert.ifError(err);
      assert.equal(res.statusCode, 200);
      assert(res.headers['content-type'].match(/text\/html/));
      assert(body.indexOf('<input name="organization"') > 0);
      assert(body.indexOf('<input name="title"') > 0);
      done();
    })
  });

  it('can override a default form by replacing it', function (done) {
    request('http://localhost:3000/forgot', function (err, res, body) {
      assert.ifError(err);
      assert.equal(res.statusCode, 200);
      assert(res.headers['content-type'].match(/text\/html/));
      assert(body.indexOf('id="forgot-override"') > 0);
      done();
    });
  });

  it('can extend a default controller by adding vars to the template context', function (done) {
    request('http://localhost:3000/register', function (err, res, body) {
      assert.ifError(err);
      assert.equal(res.statusCode, 200);
      assert(res.headers['content-type'].match(/text\/html/));
      assert(body.indexOf('value="Default Org Name"') > 0);
      done();
    })
  });

  it('can extend a default controller by adding validation', function (done) {
    request.post('http://localhost:3000/register', {email: 'dev@terraeclipse.com', firstname:'Web', lastname: 'Team'}, function (err, res, body) {
      assert.ifError(err);
      assert.equal(res.statusCode, 200);
      assert(res.headers['content-type'].match(/text\/html/));
      assert(body.indexOf('Title is required.') > 0);
      done();
    })
  });

  it('can extend a default controller by changing the rendered template', function (done) {
    request('http://localhost:3000/login', function (err, res, body) {
      assert.ifError(err);
      assert.equal(res.statusCode, 200);
      assert(res.headers['content-type'].match(/text\/html/));
      assert(body.indexOf('id="login_alt"') > 0);
      done();
    });
  });

  it('can override a default controller by replacing it', function (done) {
    request('http://localhost:3000/logout', function (err, res, body) {
      assert.ifError(err);
      assert.equal(res.statusCode, 200);
      assert(res.headers['content-type'].match(/text\/html/));
      assert(body.indexOf('<h1>Stuck here forever!</h1>') > 0);
      assert(body.indexOf('<h2>You cannot logout</h2>') > 0);
      done();
    });
  });
});
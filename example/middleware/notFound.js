module.exports = function (app) {
  function notFound (req, res, next) {
    res.statusCode = 404;
    res.vars.noScripts = true;
    return res.renderStatus(res.statusCode);
  }
  notFound.weight = 2000;
  return notFound;
};

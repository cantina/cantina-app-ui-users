module.exports = function notFound (req, res, next) {
  res.statusCode = 404;
  res.vars.noScripts = true;
  return res.renderStatus(res.statusCode);
};
module.exports.weight = 2000;
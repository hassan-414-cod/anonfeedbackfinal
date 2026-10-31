const env = require("../config/env");
const { ApiError } = require("../utils/errors");

/** CSRF defence for cookie auth: browser writes must come from an allowed frontend origin. */
function originCheck(req, _res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (origin && !env.frontendOrigins.includes(origin)) {
    return next(new ApiError(403, "bad_origin", "Cross-site request blocked."));
  }
  next();
}

module.exports = { originCheck };

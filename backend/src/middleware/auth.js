const { ApiError } = require("../utils/errors");
const { userFromRequest } = require("../services/auth");

/** Attach req.user (or null) on every request. */
async function loadUser(req, _res, next) {
  try {
    req.user = await userFromRequest(req);
    next();
  } catch (e) {
    next(e);
  }
}

function requireUser(req, _res, next) {
  if (!req.user) return next(new ApiError(401, "unauthenticated", "Please log in first."));
  next();
}

function requireStaff(req, _res, next) {
  if (!req.user) return next(new ApiError(401, "unauthenticated", "Please log in first."));
  if (req.user.role === "user") return next(new ApiError(403, "forbidden", "Moderators only."));
  next();
}

module.exports = { loadUser, requireUser, requireStaff };

const { ApiError, fromPgError } = require("../utils/errors");

function notFound(_req, _res, next) {
  next(new ApiError(404, "not_found", "Route not found."));
}

// Last middleware: every error leaves as { error: { code, message } }.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  const known = err instanceof ApiError ? err : fromPgError(err);
  if (known) {
    return res.status(known.status).json({ error: { code: known.code, message: known.message } });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: { code: "invalid_json", message: "Request body must be JSON." } });
  }
  console.error(err);
  res.status(500).json({ error: { code: "server_error", message: "Something went wrong on our side." } });
}

module.exports = { notFound, errorHandler };

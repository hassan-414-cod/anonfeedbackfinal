class ApiError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.status = status;
    this.code = code;
  }
}

// Errors raised by our DB triggers / constraints -> API errors.
const TRIGGER_ERRORS = {
  free_plan_project_limit: [403, "Free plan allows 5 projects. Delete one or upgrade to Pro."],
  free_plan_review_limit: [429, "You've hit the free limit of 15 reviews per 24 hours. Upgrade to Pro to remove it."],
  cannot_review_own_project: [403, "You can't review your own project."],
};

function fromPgError(e) {
  if (!e || typeof e.code !== "string") return null;
  if (e.code === "23505") return new ApiError(409, "duplicate", "That already exists.");
  if (e.code === "P0001") {
    // Knex prefixes the failing SQL to e.message, so match on the trigger's error name.
    const name = Object.keys(TRIGGER_ERRORS).find((k) => String(e.message).includes(k));
    if (name) {
      const [status, message] = TRIGGER_ERRORS[name];
      return new ApiError(status, name, message);
    }
  }
  return null;
}

module.exports = { ApiError, fromPgError };

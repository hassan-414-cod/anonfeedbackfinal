const { ApiError } = require("./errors");

/** Parse `data` with a zod schema; the first issue becomes a 400 with a readable message. */
function parse(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    throw new ApiError(400, "invalid_input", result.error.issues[0]?.message || "Invalid input.");
  }
  return result.data;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

module.exports = { parse, UUID };

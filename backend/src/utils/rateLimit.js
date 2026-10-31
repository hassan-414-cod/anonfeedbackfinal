const { ApiError } = require("./errors");

// Tiny in-memory limiter (per process). Swap for Redis when running several instances.
const hits = new Map();

function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    throw new ApiError(429, "rate_limited", "Too many attempts. Wait a moment and try again.");
  }
  recent.push(now);
  hits.set(key, recent);
}

module.exports = { rateLimit };

const crypto = require("crypto");
const { hash, verify } = require("@node-rs/argon2");
const db = require("../db");
const env = require("../config/env");

const COOKIE = "af_session";
const TTL_DAYS = 30;

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

const hashPassword = (password) => hash(password); // argon2id

async function verifyPassword(hashed, password) {
  try {
    return await verify(hashed, password);
  } catch {
    return false;
  }
}

async function createSession(res, accountId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);
  await db("sessions").insert({ account_id: accountId, token_hash: sha256(token), expires_at: expires });
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: env.isProd, path: "/", expires });
}

async function destroySession(req, res) {
  const token = req.cookies?.[COOKIE];
  if (token) await db("sessions").where({ token_hash: sha256(token) }).del();
  res.clearCookie(COOKIE, { path: "/" });
}

const USER_COLUMNS = [
  "a.id", db.raw("a.email::text as email"), "a.role", "p.handle",
  "p.builder_score", "p.reviewer_score", "p.subscription_status",
];

/** Resolve the logged-in user from the session cookie, or null. */
async function userFromRequest(req) {
  const token = req.cookies?.[COOKIE];
  if (!token) return null;
  const row = await db("sessions as s")
    .join("accounts as a", "a.id", "s.account_id")
    .join("profiles as p", "p.account_id", "a.id")
    .where("s.token_hash", sha256(token))
    .where("s.expires_at", ">", db.fn.now())
    .whereNull("a.banned_at")
    .first(...USER_COLUMNS);
  return row || null;
}

/** Same user shape, looked up by account id (used right after signup / login). */
async function userById(id) {
  return db("accounts as a")
    .join("profiles as p", "p.account_id", "a.id")
    .where("a.id", id)
    .first(...USER_COLUMNS);
}

const isPro = (u) => u.subscription_status === "active";

/** What the client may know about itself. `uid` is the caller's own id only. */
function meJson(u) {
  return {
    user: { uid: u.id, email: u.email, role: u.role },
    profile: {
      email: u.email,
      anonymous_handle: u.handle,
      builder_score: u.builder_score,
      reviewer_score: u.reviewer_score,
      subscription_status: u.subscription_status,
    },
  };
}

function newResetToken() {
  const token = crypto.randomBytes(32).toString("base64url");
  return { token, hash: sha256(token) };
}

module.exports = {
  hashPassword, verifyPassword, createSession, destroySession, userFromRequest, userById,
  isPro, meJson, newResetToken, hashToken: sha256,
};

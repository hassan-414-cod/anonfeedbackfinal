const { Router } = require("express");
const { z } = require("zod");
const db = require("../db");
const { ApiError } = require("../utils/errors");
const { parse } = require("../utils/validate");
const { rateLimit } = require("../utils/rateLimit");
const { generateHandle } = require("../utils/handle");
const auth = require("../services/auth");

const router = Router();

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email("That email address doesn't look right.").max(254),
  password: z.string().min(6, "Password must be at least 6 characters.").max(200),
});

router.post("/signup", async (req, res) => {
  rateLimit(`signup:${req.ip}`, 10, 60 * 60 * 1000);
  const { email, password } = parse(signupSchema, req.body);
  const password_hash = await auth.hashPassword(password);

  const accountId = await db.transaction(async (trx) => {
    let created;
    try {
      [created] = await trx("accounts").insert({ email, password_hash }).returning("id");
    } catch (e) {
      if (e.code === "23505") throw new ApiError(409, "auth/email-already-in-use", "That email already has an account. Try logging in.");
      throw e;
    }
    // Handles are random; retry on the rare collision.
    for (let i = 0; i < 8; i++) {
      const rows = await trx("profiles")
        .insert({ account_id: created.id, handle: generateHandle() })
        .onConflict("handle")
        .ignore()
        .returning("handle");
      if (rows.length) return created.id;
    }
    throw new ApiError(500, "handle_failed", "Couldn't allocate a handle. Try again.");
  });

  await auth.createSession(res, accountId);
  res.json(auth.meJson(await auth.userById(accountId)));
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

router.post("/login", async (req, res) => {
  const { email, password } = parse(loginSchema, req.body);
  rateLimit(`login:${req.ip}:${email}`, 8, 15 * 60 * 1000);

  const acc = await db("accounts").where({ email }).first("id", "password_hash", "banned_at");
  // Same error for unknown email and wrong password.
  if (!acc || !(await auth.verifyPassword(acc.password_hash, password))) {
    throw new ApiError(401, "auth/invalid-credential", "Wrong email or password.");
  }
  if (acc.banned_at) throw new ApiError(403, "banned", "This account has been suspended.");

  await auth.createSession(res, acc.id);
  res.json(auth.meJson(await auth.userById(acc.id)));
});

router.post("/logout", async (req, res) => {
  await auth.destroySession(req, res);
  res.json({ ok: true });
});

// No email provider is wired up yet: in development the reset link is printed to this
// server's console. Replace the console.log with your mailer.
router.post("/password-reset", async (req, res) => {
  rateLimit(`reset:${req.ip}`, 5, 60 * 60 * 1000);
  const { email } = parse(z.object({ email: z.string().trim().toLowerCase().email().max(254) }), req.body);
  const acc = await db("accounts").where({ email }).first("id");
  if (acc) {
    const { token, hash } = auth.newResetToken();
    await db("password_resets").insert({
      token_hash: hash,
      account_id: acc.id,
      expires_at: db.raw("now() + interval '1 hour'"),
    });
    const origin = req.headers.origin || "http://localhost:3000";
    console.log(`[password reset] ${email}: ${origin}/reset-password?token=${token}`);
  }
  // Always succeed so the endpoint can't be used to discover which emails exist.
  res.json({ ok: true });
});

const confirmSchema = z.object({ token: z.string().min(10).max(200), password: z.string().min(6).max(200) });

router.post("/password-reset/confirm", async (req, res) => {
  const { token, password } = parse(confirmSchema, req.body);
  const password_hash = await auth.hashPassword(password);
  await db.transaction(async (trx) => {
    const used = await trx("password_resets")
      .where({ token_hash: auth.hashToken(token) })
      .whereNull("used_at")
      .where("expires_at", ">", trx.fn.now())
      .update({ used_at: trx.fn.now() })
      .returning("account_id");
    if (!used.length) throw new ApiError(400, "invalid_token", "This reset link is invalid or expired.");
    const accountId = used[0].account_id;
    await trx("accounts").where({ id: accountId }).update({ password_hash });
    await trx("sessions").where({ account_id: accountId }).del(); // log out everywhere
  });
  res.json({ ok: true });
});

module.exports = router;

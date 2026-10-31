const { Router } = require("express");
const { z } = require("zod");
const db = require("../db");
const env = require("../config/env");
const { ApiError } = require("../utils/errors");
const { parse } = require("../utils/validate");
const { generateHandle } = require("../utils/handle");
const { requireUser } = require("../middleware/auth");
const auth = require("../services/auth");
const { projectBase, projectJson, feedbackBase, feedbackJson } = require("../utils/serialize");

const router = Router();

router.get("/", (req, res) => {
  res.json(req.user ? auth.meJson(req.user) : { user: null, profile: null });
});

router.delete("/", requireUser, async (req, res) => {
  await auth.destroySession(req, res);
  await db("accounts").where({ id: req.user.id }).del(); // cascades to everything they own
  res.json({ ok: true });
});

// "Burn identity": new random handle.
router.post("/handle", requireUser, async (req, res) => {
  for (let i = 0; i < 8; i++) {
    try {
      await db("profiles").where({ account_id: req.user.id }).update({ handle: generateHandle() });
      return res.json(auth.meJson(await auth.userById(req.user.id)));
    } catch (e) {
      if (e.code !== "23505") throw e; // handle collision: try another
    }
  }
  throw new ApiError(500, "handle_failed", "Couldn't allocate a handle. Try again.");
});

// Demo billing: flips the plan without taking payment. Only when DEMO_BILLING=true.
// In production remove this route and set the plan from a verified payment webhook.
router.post("/plan", requireUser, async (req, res) => {
  if (!env.demoBilling) throw new ApiError(403, "billing_disabled", "Payments aren't enabled yet.");
  const { status } = parse(z.object({ status: z.enum(["active", "inactive"]) }), req.body);
  await db("profiles").where({ account_id: req.user.id }).update({ subscription_status: status });
  res.json(auth.meJson(await auth.userById(req.user.id)));
});

router.get("/projects", requireUser, async (req, res) => {
  const rows = await projectBase().where("p.owner_id", req.user.id).orderBy("p.created_at", "desc");
  res.json({ projects: rows.map((r) => projectJson(r, req.user)) });
});

// Reviews I gave.
router.get("/feedback", requireUser, async (req, res) => {
  const rows = await feedbackBase().where("fb.reviewer_id", req.user.id).orderBy("fb.created_at", "desc");
  res.json({ feedback: rows.map((r) => feedbackJson(r, req.user)) });
});

module.exports = router;

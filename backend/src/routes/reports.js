const { Router } = require("express");
const { z } = require("zod");
const db = require("../db");
const { ApiError } = require("../utils/errors");
const { parse, UUID } = require("../utils/validate");
const { rateLimit } = require("../utils/rateLimit");
const { requireUser } = require("../middleware/auth");

const router = Router();

const schema = z.object({
  target_type: z.enum(["project", "feedback", "message"]),
  target_id: z.string().min(1).max(64),
  project_id: z.string().uuid().optional(),
  reason: z.enum(["Spam", "Abuse", "Irrelevant", "Other"]),
});

const TABLE = { project: "projects", feedback: "feedback", message: "room_messages" };

router.post("/", requireUser, async (req, res) => {
  rateLimit(`report:${req.user.id}`, 20, 60 * 60 * 1000);
  const input = parse(schema, req.body);

  const validId = input.target_type === "message" ? /^\d+$/.test(input.target_id) : UUID.test(input.target_id);
  const exists = validId && (await db(TABLE[input.target_type]).where({ id: input.target_id }).first("id"));
  if (!exists) throw new ApiError(404, "not_found", "That item no longer exists.");

  // Reporting the same item twice is a no-op (UNIQUE reporter + target).
  await db("reports")
    .insert({
      reporter_id: req.user.id,
      target_type: input.target_type,
      target_id: input.target_id,
      project_id: input.project_id ?? null,
      reason: input.reason,
    })
    .onConflict(["reporter_id", "target_type", "target_id"])
    .ignore();
  res.json({ ok: true });
});

module.exports = router;

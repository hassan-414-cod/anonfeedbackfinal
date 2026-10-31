const { Router } = require("express");
const db = require("../db");
const { ApiError } = require("../utils/errors");
const { UUID } = require("../utils/validate");
const { requireUser } = require("../middleware/auth");

const router = Router();

// Project owner marks a review helpful. Idempotent: the reviewer's score is bumped by a DB
// trigger only on the false -> true transition.
router.post("/:id/helpful", requireUser, async (req, res) => {
  if (!UUID.test(req.params.id)) throw new ApiError(404, "not_found", "Feedback not found.");
  const fb = await db("feedback as f")
    .join("projects as p", "p.id", "f.project_id")
    .where("f.id", req.params.id)
    .first("p.owner_id");
  if (!fb) throw new ApiError(404, "not_found", "Feedback not found.");
  if (fb.owner_id !== req.user.id) throw new ApiError(403, "forbidden", "Only the project owner can do that.");
  await db("feedback").where({ id: req.params.id }).update({ marked_helpful: true });
  res.json({ ok: true });
});

module.exports = router;

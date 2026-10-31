const { Router } = require("express");
const { z } = require("zod");
const db = require("../db");
const { ApiError } = require("../utils/errors");
const { parse, UUID } = require("../utils/validate");
const { requireStaff } = require("../middleware/auth");

const router = Router();
router.use(requireStaff);

router.get("/stats", async (_req, res) => {
  const { rows } = await db.raw(`
    SELECT (SELECT count(*) FROM accounts)::int AS accounts,
           (SELECT count(*) FROM projects)::int AS projects,
           (SELECT count(*) FROM feedback)::int AS feedback,
           (SELECT count(*) FROM room_messages)::int AS messages,
           (SELECT count(*) FROM reports WHERE status = 'open')::int AS open_reports,
           (SELECT count(*) FROM profiles WHERE subscription_status = 'active')::int AS pro_users`);
  res.json({ stats: rows[0] });
});

// Report queue. Reporter identities are never returned.
router.get("/reports", async (req, res) => {
  const status = ["open", "reviewed", "dismissed", "actioned"].includes(req.query.status) ? req.query.status : "open";
  const { rows } = await db.raw(
    `SELECT r.id, r.target_type, r.target_id, r.project_id, r.reason, r.status, r.created_at,
            CASE r.target_type
              WHEN 'project'  THEN (SELECT title FROM projects WHERE id::text = r.target_id)
              WHEN 'feedback' THEN (SELECT left(concat_ws(' / ', nullif(whats_good,''), nullif(whats_improvable,''), nullif(suggested_next_step,'')), 300)
                                      FROM feedback WHERE id::text = r.target_id)
              WHEN 'message'  THEN (SELECT left(body, 300) FROM room_messages WHERE id::text = r.target_id)
            END AS preview,
            CASE r.target_type
              WHEN 'project'  THEN (SELECT pr.handle FROM projects p JOIN profiles pr ON pr.account_id = p.owner_id WHERE p.id::text = r.target_id)
              WHEN 'feedback' THEN (SELECT pr.handle FROM feedback f JOIN profiles pr ON pr.account_id = f.reviewer_id WHERE f.id::text = r.target_id)
              WHEN 'message'  THEN (SELECT pr.handle FROM room_messages m JOIN profiles pr ON pr.account_id = m.author_id WHERE m.id::text = r.target_id)
            END AS author_handle
       FROM reports r
      WHERE r.status = ?::report_status
      ORDER BY r.created_at ASC
      LIMIT 200`,
    [status],
  );
  res.json({ reports: rows });
});

const TABLE = { project: "projects", feedback: "feedback", message: "room_messages" };
const AUTHOR_COL = { project: "owner_id", feedback: "reviewer_id", message: "author_id" };

router.post("/reports/:id", async (req, res) => {
  const { action } = parse(z.object({ action: z.enum(["dismiss", "hide", "hide_and_ban"]) }), req.body);
  if (!UUID.test(req.params.id)) throw new ApiError(404, "not_found", "Report not found.");

  await db.transaction(async (trx) => {
    const rep = await trx("reports").where({ id: req.params.id }).forUpdate().first("target_type", "target_id");
    if (!rep) throw new ApiError(404, "not_found", "Report not found.");
    const type = rep.target_type;

    if (action === "dismiss") {
      await trx("reports").where({ id: req.params.id }).update({ status: "dismissed" });
      return;
    }
    if (action === "hide_and_ban" && req.user.role !== "admin") {
      throw new ApiError(403, "forbidden", "Only admins can ban accounts.");
    }

    const hidden = await trx(TABLE[type])
      .whereRaw("id::text = ?", [rep.target_id])
      .update({ hidden_at: trx.fn.now() })
      .returning(AUTHOR_COL[type]);

    if (action === "hide_and_ban" && hidden[0]) {
      const author = hidden[0][AUTHOR_COL[type]];
      if (author === req.user.id) throw new ApiError(400, "self_ban", "You can't ban yourself.");
      await trx("accounts").where({ id: author }).update({ banned_at: trx.fn.now() });
      await trx("sessions").where({ account_id: author }).del();
    }
    // Resolve every open report on the same target.
    await trx("reports")
      .where({ target_type: rep.target_type, target_id: rep.target_id, status: "open" })
      .update({ status: "actioned" });
  });
  res.json({ ok: true });
});

module.exports = router;

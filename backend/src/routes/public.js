const { Router } = require("express");
const db = require("../db");

const router = Router();

// Top 20 masks. The handle doubles as the row id: no account ids leave the server.
router.get("/leaderboard", async (req, res) => {
  const col = req.query.by === "reviewer" ? "reviewer_score" : "builder_score";
  const users = await db("profiles")
    .select("handle as id", "handle as anonymous_handle", "builder_score", "reviewer_score")
    .where(col, ">", 0)
    .orderBy(col, "desc")
    .orderBy("created_at", "asc")
    .limit(20);
  res.json({ users });
});

// Public counters for the landing page.
router.get("/stats", async (_req, res) => {
  const { rows } = await db.raw(`
    SELECT (SELECT count(*) FROM profiles)::int AS users,
           (SELECT count(*) FROM projects WHERE hidden_at IS NULL)::int AS projects,
           (SELECT count(*) FROM feedback WHERE hidden_at IS NULL)::int AS feedback`);
  res.json(rows[0]);
});

router.get("/health", async (_req, res) => {
  await db.raw("SELECT 1");
  res.json({ ok: true });
});

module.exports = router;

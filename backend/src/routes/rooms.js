const crypto = require("crypto");
const { Router } = require("express");
const { z } = require("zod");
const db = require("../db");
const { ROOM_TOPICS } = require("../constants");
const { ApiError } = require("../utils/errors");
const { parse } = require("../utils/validate");
const { rateLimit } = require("../utils/rateLimit");
const { requireUser } = require("../middleware/auth");

const router = Router();

const ROOM_COLUMNS = ["id", "name", "topic", "description", "message_count", "last_message_at", "created_at"];

router.get("/", async (_req, res) => {
  const rooms = await db("rooms")
    .select(ROOM_COLUMNS)
    .orderByRaw("last_message_at DESC NULLS LAST")
    .orderBy("created_at", "desc");
  res.json({ rooms });
});

const createSchema = z.object({
  name: z.string().trim().min(1, "Give the room a name.").max(60),
  topic: z.enum(ROOM_TOPICS),
  description: z.string().trim().max(200).default(""),
});

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30) || "room";

router.post("/", requireUser, async (req, res) => {
  rateLimit(`room:${req.user.id}`, 5, 60 * 60 * 1000);
  const input = parse(createSchema, req.body);
  const id = `${slugify(input.name)}-${crypto.randomBytes(3).toString("hex")}`;
  await db("rooms").insert({ id, name: input.name, topic: input.topic, description: input.description, created_by: req.user.id });
  res.json({ id });
});

router.get("/:id", async (req, res) => {
  const room = await db("rooms").where({ id: req.params.id }).first(ROOM_COLUMNS);
  if (!room) throw new ApiError(404, "not_found", "Room not found.");
  res.json({ room });
});

/* -------------------------------------------------------------- messages */

const messageBase = () =>
  db("room_messages as m")
    .join("profiles as pr", "pr.account_id", "m.author_id")
    .select(db.raw("m.id::text as id"), "m.body as text", "pr.handle as author_handle", "m.author_id", "m.created_at");

const messageJson = (r, viewer) => ({
  id: r.id,
  text: r.text,
  author_handle: r.author_handle,
  is_mine: !!viewer && viewer.id === r.author_id,
  created_at: r.created_at,
});

// Last 200 messages, oldest first. `?after=<id>` returns only newer ones (used for polling).
router.get("/:id/messages", async (req, res) => {
  const after = typeof req.query.after === "string" && /^\d+$/.test(req.query.after) ? req.query.after : null;
  const base = messageBase().where("m.room_id", req.params.id).whereNull("m.hidden_at");
  const rows = after
    ? await base.where("m.id", ">", after).orderBy("m.id", "asc").limit(200)
    : (await base.orderBy("m.id", "desc").limit(200)).reverse();
  res.json({ messages: rows.map((r) => messageJson(r, req.user)) });
});

router.post("/:id/messages", requireUser, async (req, res) => {
  rateLimit(`msg:${req.user.id}`, 5, 5000);
  const { text } = parse(z.object({ text: z.string().trim().min(1, "Type a message.").max(2000) }), req.body);
  const room = await db("rooms").where({ id: req.params.id }).first("id");
  if (!room) throw new ApiError(404, "not_found", "Room not found.");
  // rooms.message_count / last_message_at are kept fresh by a DB trigger.
  const [created] = await db("room_messages")
    .insert({ room_id: req.params.id, author_id: req.user.id, body: text })
    .returning("id");
  const saved = await messageBase().where("m.id", created.id).first();
  res.json({ message: messageJson(saved, req.user) });
});

module.exports = router;

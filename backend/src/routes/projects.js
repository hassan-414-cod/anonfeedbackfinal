const fs = require("fs");
const { Router } = require("express");
const { z } = require("zod");
const db = require("../db");
const { CATEGORIES } = require("../constants");
const { ApiError } = require("../utils/errors");
const { parse, UUID } = require("../utils/validate");
const { UPLOAD_TYPES, INLINE_SAFE, ext, safeName } = require("../utils/uploads");
const { projectBase, projectJson, feedbackBase, feedbackJson } = require("../utils/serialize");
const { requireUser } = require("../middleware/auth");
const { uploadFile } = require("../middleware/upload");
const storage = require("../services/storage");

const router = Router();

const isStaff = (u) => !!u && u.role !== "user";

async function loadProject(id) {
  if (!UUID.test(id)) return null;
  return (await projectBase().where("p.id", id).first()) || null;
}

/* ------------------------------------------------------------------ list */

router.get("/", async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 100);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  const { category, q, sort } = req.query;

  const query = projectBase().whereNull("p.hidden_at");
  if (typeof category === "string" && category) query.where("p.category", category);
  if (typeof q === "string" && q.trim()) {
    const like = `%${q.trim().replace(/[%_\\]/g, "\\$&")}%`;
    query.where((b) => b.whereILike("p.title", like).orWhereILike("p.description", like));
  }
  if (sort === "top") query.orderByRaw("(p.upvotes - p.downvotes) DESC").orderBy("p.created_at", "desc");
  else query.orderBy("p.created_at", "desc");

  const rows = await query.limit(limit).offset(offset);
  res.json({ projects: rows.map((r) => projectJson(r, req.user)) });
});

/* ---------------------------------------------------------------- create */

const createSchema = z.object({
  title: z.string().trim().min(1, "Give your project a title.").max(120),
  category: z.enum(CATEGORIES),
  description: z.string().trim().max(5000).default(""),
  type: z.enum(["link", "doc", "code", "image", "video"]),
  permission: z.enum(["off", "view_only", "download_allowed"]).default("view_only"),
  url: z.string().trim().max(2000).optional(),
  code: z.string().max(100000).optional(),
});

// Multipart form: the text fields above plus an optional `file`.
router.post("/", requireUser, uploadFile, async (req, res) => {
  const file = req.file; // already on disk (multer)
  const discard = () => (file ? fs.promises.rm(file.path, { force: true }) : Promise.resolve());

  try {
    const input = parse(createSchema, req.body);

    let linkUrl = null;
    let code = null;
    if (input.type === "link") {
      try {
        const parsed = new URL(input.url || "");
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
        linkUrl = parsed.toString();
      } catch {
        throw new ApiError(400, "invalid_url", "Enter a valid http(s) link.");
      }
    }
    if (input.type === "code") {
      if (!input.code || !input.code.trim()) throw new ApiError(400, "invalid_code", "Paste your code snippet.");
      code = input.code;
    }

    let fileRow = null;
    if (["doc", "image", "video"].includes(input.type)) {
      if (!file) throw new ApiError(400, "file_required", "Attach a file.");
      const contentType = UPLOAD_TYPES[input.type][ext(file.originalname)];
      if (!contentType) throw new ApiError(415, "file_type", `That file type isn't allowed for ${input.type} projects.`);
      fileRow = {
        storage_key: `projects/${req.user.id}/${file.filename}`,
        file_name: safeName(file.originalname),
        content_type: contentType,
        size_bytes: file.size,
      };
    }

    // The Free-plan project limit is enforced by a database trigger.
    const id = await db.transaction(async (trx) => {
      const [project] = await trx("projects")
        .insert({
          owner_id: req.user.id,
          title: input.title,
          category: input.category,
          description: input.description,
          type: input.type,
          link_url: linkUrl,
          code_snippet: code,
          download_permission: input.permission,
        })
        .returning("id");
      if (fileRow) await trx("project_files").insert({ project_id: project.id, ...fileRow });
      return project.id;
    });
    res.json({ id });
  } catch (e) {
    await discard();
    throw e;
  }
});

/* ----------------------------------------------------------- single item */

router.get("/:id", async (req, res) => {
  const p = await loadProject(req.params.id);
  const visible = p && (!p.hidden_at || (req.user && (req.user.id === p.owner_id || isStaff(req.user))));
  if (!p || !visible) throw new ApiError(404, "not_found", "Project not found.");
  res.json({ project: projectJson(p, req.user) });
});

router.patch("/:id", requireUser, async (req, res) => {
  const { download_permission } = parse(z.object({ download_permission: z.enum(["off", "view_only", "download_allowed"]) }), req.body);
  const p = await loadProject(req.params.id);
  if (!p) throw new ApiError(404, "not_found", "Project not found.");
  if (p.owner_id !== req.user.id) throw new ApiError(403, "forbidden", "Only the owner can change this.");
  await db("projects").where({ id: p.id }).update({ download_permission });
  res.json({ ok: true });
});

router.delete("/:id", requireUser, async (req, res) => {
  const p = await loadProject(req.params.id);
  if (!p) throw new ApiError(404, "not_found", "Project not found.");
  if (p.owner_id !== req.user.id && !isStaff(req.user)) throw new ApiError(403, "forbidden", "Only the owner can delete this.");
  const file = await db("project_files").where({ project_id: p.id }).first("storage_key");
  await db("projects").where({ id: p.id }).del();
  if (file) await storage.removeFile(file.storage_key).catch(() => {});
  res.json({ ok: true });
});

/* ------------------------------------------------------------------ file
   Streams the stored file, enforcing the owner's download_permission:
     off              -> owner only
     view_only        -> inline viewing, never an attachment download
     download_allowed -> inline, or attachment with ?download=1 */

router.get("/:id/file", async (req, res) => {
  const row = UUID.test(req.params.id)
    ? await db("projects as p")
        .join("project_files as f", "f.project_id", "p.id")
        .where("p.id", req.params.id)
        .first("p.owner_id", "p.download_permission", "p.hidden_at", "f.storage_key", "f.file_name", "f.content_type")
    : null;
  const isOwner = !!req.user && !!row && req.user.id === row.owner_id;
  const staff = isStaff(req.user);
  if (!row || (row.hidden_at && !isOwner && !staff)) throw new ApiError(404, "not_found", "File not found.");
  if (row.download_permission === "off" && !isOwner && !staff) throw new ApiError(403, "file_hidden", "The owner hid this file.");

  const wantsDownload = req.query.download === "1";
  if (wantsDownload && row.download_permission !== "download_allowed" && !isOwner && !staff) {
    throw new ApiError(403, "download_disabled", "Downloads are disabled for this project.");
  }

  const stat = await storage.statFile(row.storage_key).catch(() => null);
  if (!stat) throw new ApiError(404, "not_found", "File not found.");

  let start = 0;
  let end = stat.size - 1;
  let status = 200;
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
  if (range && (range[1] || range[2])) {
    if (range[1]) {
      start = parseInt(range[1], 10);
      if (range[2]) end = Math.min(parseInt(range[2], 10), end);
    } else {
      start = Math.max(stat.size - parseInt(range[2], 10), 0); // last N bytes
    }
    if (start > end) throw new ApiError(416, "bad_range", "Range not satisfiable.");
    status = 206;
  }

  const inline = INLINE_SAFE.has(row.content_type) && !wantsDownload;
  res.status(status).set({
    "Content-Type": row.content_type,
    "Content-Length": String(end - start + 1),
    "Accept-Ranges": "bytes",
    "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${row.file_name}"`,
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "sandbox",
    "Cache-Control": "private, max-age=0, must-revalidate",
    ...(status === 206 ? { "Content-Range": `bytes ${start}-${end}/${stat.size}` } : {}),
  });
  const stream = storage.readStream(row.storage_key, { start, end });
  stream.on("error", () => res.destroy());
  stream.pipe(res);
});

/* -------------------------------------------------------------- feedback */

router.get("/:id/feedback", async (req, res) => {
  if (!UUID.test(req.params.id)) return res.json({ feedback: [] });
  const rows = await feedbackBase()
    .where("fb.project_id", req.params.id)
    .whereNull("fb.hidden_at")
    .orderBy("fb.created_at", "desc");
  res.json({ feedback: rows.map((r) => feedbackJson(r, req.user)) });
});

// Optional text fields must be 20+ chars when filled (same rule as the UI).
const text = z
  .string()
  .trim()
  .max(3000)
  .default("")
  .refine((t) => t === "" || t.length >= 20, "Each text field must be at least 20 characters if filled.");

const feedbackSchema = z.object({
  vote: z.enum(["up", "down"]),
  whats_good: text,
  whats_improvable: text,
  suggested_next_step: text,
});

router.post("/:id/feedback", requireUser, async (req, res) => {
  if (!UUID.test(req.params.id)) throw new ApiError(404, "not_found", "Project not found.");
  const input = parse(feedbackSchema, req.body);
  const project = await db("projects").where({ id: req.params.id }).whereNull("hidden_at").first("id");
  if (!project) throw new ApiError(404, "not_found", "Project not found.");

  // Counters, builder_score, the one-review-per-user rule, the 15/24h Free limit and the
  // "not your own project" rule are all enforced by DB constraints/triggers.
  let created;
  try {
    [created] = await db("feedback")
      .insert({
        project_id: req.params.id,
        reviewer_id: req.user.id,
        vote: input.vote,
        whats_good: input.whats_good,
        whats_improvable: input.whats_improvable,
        suggested_next_step: input.suggested_next_step,
      })
      .returning("id");
  } catch (e) {
    if (e.code === "23505") throw new ApiError(409, "already_reviewed", "You already reviewed this project.");
    throw e;
  }
  const saved = await feedbackBase().where("fb.id", created.id).first();
  res.json({ feedback: feedbackJson(saved, req.user) });
});

module.exports = router;

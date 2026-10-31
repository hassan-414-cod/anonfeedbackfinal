const db = require("../db");

// Public JSON shapes. They keep the field names the frontend already uses, but never include
// another user's account id or email: only the mask handle plus is_owner / is_mine flags.

const projectBase = () =>
  db("projects as p")
    .join("profiles as pr", "pr.account_id", "p.owner_id")
    .leftJoin("project_files as f", "f.project_id", "p.id")
    .select(
      "p.id", "p.owner_id", "pr.handle as owner_handle", "p.title", "p.category", "p.description",
      "p.type", "p.link_url", "p.code_snippet", "p.download_permission",
      "p.upvotes", "p.downvotes", "p.feedback_count", "p.hidden_at", "p.created_at",
      "f.file_name", "f.content_type as file_type", "f.size_bytes as file_size",
    );

function projectJson(r, viewer) {
  const isOwner = !!viewer && viewer.id === r.owner_id;
  const hideFile = r.download_permission === "off" && !isOwner;
  return {
    id: r.id,
    owner_handle: r.owner_handle,
    is_owner: isOwner,
    title: r.title,
    category: r.category,
    description: r.description,
    type: r.type,
    link_or_file_url: r.link_url ?? undefined,
    code_snippet: r.code_snippet ?? undefined,
    download_permission: r.download_permission,
    upvotes: r.upvotes,
    downvotes: r.downvotes,
    feedback_count: r.feedback_count,
    created_at: r.created_at,
    ...(r.file_name
      ? {
          file_url: hideFile ? undefined : `/api/projects/${r.id}/file`,
          file_name: r.file_name,
          file_type: r.file_type,
          file_size: Number(r.file_size),
        }
      : {}),
  };
}

const feedbackBase = () =>
  db("feedback as fb")
    .join("profiles as pr", "pr.account_id", "fb.reviewer_id")
    .join("projects as p", "p.id", "fb.project_id")
    .select(
      "fb.id", "fb.project_id", "fb.reviewer_id", "pr.handle as reviewer_handle", "fb.vote",
      "fb.whats_good", "fb.whats_improvable", "fb.suggested_next_step",
      "fb.marked_helpful", "fb.created_at", "p.title as project_title",
    );

function feedbackJson(r, viewer) {
  return {
    id: r.id,
    project_id: r.project_id,
    project_title: r.project_title,
    reviewer_handle: r.reviewer_handle,
    is_mine: !!viewer && viewer.id === r.reviewer_id,
    vote: r.vote,
    whats_good: r.whats_good,
    whats_improvable: r.whats_improvable,
    suggested_next_step: r.suggested_next_step,
    has_text: !!(r.whats_good || r.whats_improvable || r.suggested_next_step),
    marked_helpful: r.marked_helpful,
    created_at: r.created_at,
  };
}

module.exports = { projectBase, projectJson, feedbackBase, feedbackJson };

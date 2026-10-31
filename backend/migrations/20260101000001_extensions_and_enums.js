exports.up = async (knex) => {
  await knex.raw("CREATE EXTENSION IF NOT EXISTS pgcrypto"); // gen_random_uuid()
  await knex.raw("CREATE EXTENSION IF NOT EXISTS citext"); // case-insensitive email
  await knex.raw("CREATE TYPE project_type        AS ENUM ('link', 'doc', 'code', 'image', 'video')");
  await knex.raw("CREATE TYPE download_permission AS ENUM ('off', 'view_only', 'download_allowed')");
  await knex.raw("CREATE TYPE plan_status         AS ENUM ('inactive', 'active')");
  await knex.raw("CREATE TYPE vote_kind           AS ENUM ('up', 'down')");
  await knex.raw("CREATE TYPE report_target       AS ENUM ('project', 'feedback', 'message')");
  await knex.raw("CREATE TYPE report_reason       AS ENUM ('Spam', 'Abuse', 'Irrelevant', 'Other')");
  await knex.raw("CREATE TYPE report_status       AS ENUM ('open', 'reviewed', 'dismissed', 'actioned')");
  await knex.raw("CREATE TYPE user_role           AS ENUM ('user', 'moderator', 'admin')");
};

exports.down = async (knex) => {
  for (const t of ["user_role", "report_status", "report_reason", "report_target", "vote_kind", "plan_status", "download_permission", "project_type"]) {
    await knex.raw(`DROP TYPE IF EXISTS ${t}`);
  }
};

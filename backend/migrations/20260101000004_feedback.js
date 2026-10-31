exports.up = async (knex) => {
  await knex.schema.createTable("feedback", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("project_id").notNullable().references("id").inTable("projects").onDelete("CASCADE");
    t.uuid("reviewer_id").notNullable().references("id").inTable("accounts").onDelete("CASCADE");
    t.specificType("vote", "vote_kind").notNullable();
    t.text("whats_good").notNullable().defaultTo("");
    t.text("whats_improvable").notNullable().defaultTo("");
    t.text("suggested_next_step").notNullable().defaultTo("");
    t.boolean("marked_helpful").notNullable().defaultTo(false);
    t.timestamp("hidden_at", { useTz: true });
    t.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(["project_id", "reviewer_id"]); // one review per user per project
  });
  await knex.raw("CREATE INDEX feedback_project_idx  ON feedback (project_id, created_at DESC)");
  await knex.raw("CREATE INDEX feedback_reviewer_idx ON feedback (reviewer_id, created_at DESC)"); // daily-limit check
};

exports.down = (knex) => knex.schema.dropTableIfExists("feedback");

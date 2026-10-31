// Anonymity: credentials (email) live in `accounts`; everything public lives in `profiles`.
// The API only ever exposes profiles.handle, never account ids or emails.
exports.up = async (knex) => {
  await knex.schema.createTable("accounts", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.specificType("email", "citext").notNullable().unique();
    t.text("password_hash").notNullable(); // argon2id
    t.boolean("email_verified").notNullable().defaultTo(false);
    t.specificType("role", "user_role").notNullable().defaultTo(knex.raw("'user'::user_role"));
    t.timestamp("banned_at", { useTz: true });
    t.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("sessions", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("account_id").notNullable().references("id").inTable("accounts").onDelete("CASCADE");
    t.text("token_hash").notNullable().unique();
    t.timestamp("expires_at", { useTz: true }).notNullable();
    t.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index("account_id");
  });

  await knex.schema.createTable("password_resets", (t) => {
    t.text("token_hash").primary();
    t.uuid("account_id").notNullable().references("id").inTable("accounts").onDelete("CASCADE");
    t.timestamp("expires_at", { useTz: true }).notNullable();
    t.timestamp("used_at", { useTz: true });
  });

  await knex.schema.createTable("profiles", (t) => {
    t.uuid("account_id").primary().references("id").inTable("accounts").onDelete("CASCADE");
    t.text("handle").notNullable().unique(); // e.g. NeonFox#4821
    t.integer("builder_score").notNullable().defaultTo(0);
    t.integer("reviewer_score").notNullable().defaultTo(0);
    t.specificType("subscription_status", "plan_status").notNullable().defaultTo(knex.raw("'inactive'::plan_status"));
    t.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
  await knex.raw("ALTER TABLE profiles ADD CONSTRAINT profiles_scores_nonneg CHECK (builder_score >= 0 AND reviewer_score >= 0)");
  await knex.raw("CREATE INDEX profiles_builder_score_idx  ON profiles (builder_score DESC)"); // leaderboard
  await knex.raw("CREATE INDEX profiles_reviewer_score_idx ON profiles (reviewer_score DESC)");
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("profiles");
  await knex.schema.dropTableIfExists("password_resets");
  await knex.schema.dropTableIfExists("sessions");
  await knex.schema.dropTableIfExists("accounts");
};

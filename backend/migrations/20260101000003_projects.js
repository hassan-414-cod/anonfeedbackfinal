exports.up = async (knex) => {
  await knex.schema.createTable("projects", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("owner_id").notNullable().references("id").inTable("accounts").onDelete("CASCADE");
    t.text("title").notNullable();
    t.text("category").notNullable(); // Web App, Mobile App, AI Agent, ...
    t.text("description").notNullable().defaultTo("");
    t.specificType("type", "project_type").notNullable();
    t.text("link_url"); // type = link
    t.text("code_snippet"); // type = code
    t.specificType("download_permission", "download_permission").notNullable().defaultTo(knex.raw("'view_only'::download_permission"));
    t.integer("upvotes").notNullable().defaultTo(0);
    t.integer("downvotes").notNullable().defaultTo(0);
    t.integer("feedback_count").notNullable().defaultTo(0);
    t.timestamp("hidden_at", { useTz: true }); // soft-hide by moderation
    t.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index("owner_id");
    t.index("category");
  });
  await knex.raw("ALTER TABLE projects ADD CONSTRAINT projects_title_len CHECK (char_length(title) BETWEEN 1 AND 120)");
  await knex.raw("ALTER TABLE projects ADD CONSTRAINT projects_link_needs_url CHECK (type <> 'link' OR link_url IS NOT NULL)");
  await knex.raw("ALTER TABLE projects ADD CONSTRAINT projects_code_needs_snippet CHECK (type <> 'code' OR code_snippet IS NOT NULL)");
  await knex.raw("CREATE INDEX projects_feed_idx ON projects (created_at DESC) WHERE hidden_at IS NULL");

  // doc / image / video uploads (one file per project)
  await knex.schema.createTable("project_files", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("project_id").notNullable().unique().references("id").inTable("projects").onDelete("CASCADE");
    t.text("storage_key").notNullable(); // relative path / object key, NOT a public URL
    t.text("file_name").notNullable();
    t.text("content_type").notNullable();
    t.bigInteger("size_bytes").notNullable();
    t.timestamp("scanned_at", { useTz: true }); // set after virus scan (future)
  });
  await knex.raw("ALTER TABLE project_files ADD CONSTRAINT project_files_size_pos CHECK (size_bytes > 0)");
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("project_files");
  await knex.schema.dropTableIfExists("projects");
};

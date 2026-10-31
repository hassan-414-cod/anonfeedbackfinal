exports.up = async (knex) => {
  await knex.schema.createTable("rooms", (t) => {
    t.text("id").primary(); // slug: 'design-roast', ...
    t.text("name").notNullable();
    t.text("topic").notNullable(); // Design Feedback, Code Review, ...
    t.text("description").notNullable().defaultTo("");
    t.uuid("created_by").references("id").inTable("accounts").onDelete("SET NULL");
    t.integer("message_count").notNullable().defaultTo(0);
    t.timestamp("last_message_at", { useTz: true });
    t.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("room_messages", (t) => {
    t.bigIncrements("id");
    t.text("room_id").notNullable().references("id").inTable("rooms").onDelete("CASCADE");
    t.uuid("author_id").notNullable().references("id").inTable("accounts").onDelete("CASCADE");
    t.text("body").notNullable();
    t.timestamp("hidden_at", { useTz: true });
    t.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index(["room_id", "created_at"]);
  });
  await knex.raw("ALTER TABLE room_messages ADD CONSTRAINT room_messages_body_len CHECK (char_length(body) BETWEEN 1 AND 2000)");
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("room_messages");
  await knex.schema.dropTableIfExists("rooms");
};

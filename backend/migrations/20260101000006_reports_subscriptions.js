exports.up = async (knex) => {
  await knex.schema.createTable("reports", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("reporter_id").notNullable().references("id").inTable("accounts").onDelete("CASCADE");
    t.specificType("target_type", "report_target").notNullable();
    t.text("target_id").notNullable(); // uuid or bigint as text
    t.uuid("project_id").references("id").inTable("projects").onDelete("CASCADE");
    t.specificType("reason", "report_reason").notNullable();
    t.specificType("status", "report_status").notNullable().defaultTo(knex.raw("'open'::report_status"));
    t.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(["reporter_id", "target_type", "target_id"]); // no duplicate reports
    t.index(["status", "created_at"]);
  });

  // Mirror of payment-provider state (Stripe / Razorpay), filled by webhooks in production.
  await knex.schema.createTable("subscriptions", (t) => {
    t.uuid("account_id").primary().references("id").inTable("accounts").onDelete("CASCADE");
    t.text("provider").notNullable();
    t.text("provider_customer_id").notNullable();
    t.text("provider_sub_id").unique();
    t.text("status").notNullable();
    t.timestamp("current_period_end", { useTz: true });
    t.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("subscriptions");
  await knex.schema.dropTableIfExists("reports");
};

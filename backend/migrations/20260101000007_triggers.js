// Server-side rules that used to live in the browser. Doing them in the database means
// every code path (API, scripts, future services) gets the same guarantees, atomically.
exports.up = async (knex) => {
  // Submitting feedback: bump project counters and the owner's builder_score.
  await knex.raw(`
    CREATE FUNCTION on_feedback_insert() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      UPDATE projects
         SET upvotes        = upvotes   + (NEW.vote = 'up')::int,
             downvotes      = downvotes + (NEW.vote = 'down')::int,
             feedback_count = feedback_count + 1
       WHERE id = NEW.project_id;

      IF NEW.vote = 'up' THEN
        UPDATE profiles SET builder_score = builder_score + 1
         WHERE account_id = (SELECT owner_id FROM projects WHERE id = NEW.project_id);
      END IF;
      RETURN NEW;
    END $$`);
  await knex.raw("CREATE TRIGGER trg_feedback_insert AFTER INSERT ON feedback FOR EACH ROW EXECUTE FUNCTION on_feedback_insert()");

  // Owner marks feedback helpful: reward the reviewer once (false -> true only).
  await knex.raw(`
    CREATE FUNCTION on_feedback_helpful() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF NEW.marked_helpful AND NOT OLD.marked_helpful THEN
        UPDATE profiles SET reviewer_score = reviewer_score + 1 WHERE account_id = NEW.reviewer_id;
      END IF;
      RETURN NEW;
    END $$`);
  await knex.raw("CREATE TRIGGER trg_feedback_helpful AFTER UPDATE OF marked_helpful ON feedback FOR EACH ROW EXECUTE FUNCTION on_feedback_helpful()");

  // Chat: keep room metadata fresh.
  await knex.raw(`
    CREATE FUNCTION on_message_insert() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      UPDATE rooms SET message_count = message_count + 1, last_message_at = NEW.created_at WHERE id = NEW.room_id;
      RETURN NEW;
    END $$`);
  await knex.raw("CREATE TRIGGER trg_message_insert AFTER INSERT ON room_messages FOR EACH ROW EXECUTE FUNCTION on_message_insert()");

  // Free plan: 5 projects. Pro = profiles.subscription_status = 'active'.
  await knex.raw(`
    CREATE FUNCTION enforce_project_limit() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF (SELECT subscription_status FROM profiles WHERE account_id = NEW.owner_id) <> 'active'
         AND (SELECT count(*) FROM projects WHERE owner_id = NEW.owner_id) >= 5 THEN
        RAISE EXCEPTION 'free_plan_project_limit' USING ERRCODE = 'P0001';
      END IF;
      RETURN NEW;
    END $$`);
  await knex.raw("CREATE TRIGGER trg_project_limit BEFORE INSERT ON projects FOR EACH ROW EXECUTE FUNCTION enforce_project_limit()");

  // Free plan: 15 reviews per 24h. Nobody reviews their own project.
  await knex.raw(`
    CREATE FUNCTION enforce_review_rules() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF (SELECT subscription_status FROM profiles WHERE account_id = NEW.reviewer_id) <> 'active'
         AND (SELECT count(*) FROM feedback
               WHERE reviewer_id = NEW.reviewer_id
                 AND created_at >= now() - interval '24 hours') >= 15 THEN
        RAISE EXCEPTION 'free_plan_review_limit' USING ERRCODE = 'P0001';
      END IF;
      IF EXISTS (SELECT 1 FROM projects WHERE id = NEW.project_id AND owner_id = NEW.reviewer_id) THEN
        RAISE EXCEPTION 'cannot_review_own_project' USING ERRCODE = 'P0001';
      END IF;
      RETURN NEW;
    END $$`);
  await knex.raw("CREATE TRIGGER trg_review_rules BEFORE INSERT ON feedback FOR EACH ROW EXECUTE FUNCTION enforce_review_rules()");
};

exports.down = async (knex) => {
  await knex.raw("DROP TRIGGER IF EXISTS trg_review_rules ON feedback");
  await knex.raw("DROP TRIGGER IF EXISTS trg_project_limit ON projects");
  await knex.raw("DROP TRIGGER IF EXISTS trg_message_insert ON room_messages");
  await knex.raw("DROP TRIGGER IF EXISTS trg_feedback_helpful ON feedback");
  await knex.raw("DROP TRIGGER IF EXISTS trg_feedback_insert ON feedback");
  for (const f of ["enforce_review_rules", "enforce_project_limit", "on_message_insert", "on_feedback_helpful", "on_feedback_insert"]) {
    await knex.raw(`DROP FUNCTION IF EXISTS ${f}()`);
  }
};

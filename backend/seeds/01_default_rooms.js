// Idempotent: safe to run on every deploy.
const ROOMS = [
  { id: "design-roast", name: "Design Roast", topic: "Design Feedback", description: "Brutally honest takes on UI, UX and visuals." },
  { id: "code-review", name: "Code Review & Architecture", topic: "Code Review", description: "Paste a snippet, get it picked apart." },
  { id: "startup-ideas", name: "Startup Ideas Validation", topic: "Startup Ideas", description: "Pitch it. Nobody knows who you are." },
  { id: "general", name: "General Chat", topic: "General Chat", description: "Anything goes. Nothing is traced." },
];

exports.seed = async (knex) => {
  await knex("rooms").insert(ROOMS).onConflict("id").ignore();
};

const env = require("./config/env");
const db = require("./db");
const app = require("./app");

const server = app.listen(env.port, () => {
  console.log(`AnonFeedback API listening on http://localhost:${env.port}`);
});

function shutdown() {
  server.close(() => db.destroy().finally(() => process.exit(0)));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

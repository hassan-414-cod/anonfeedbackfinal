const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true }); // works from any working directory

module.exports = {
  client: "pg",
  connection: process.env.DATABASE_URL,
  pool: { min: 0, max: 10 },
  migrations: { directory: "./migrations", tableName: "knex_migrations" },
  seeds: { directory: "./seeds" },
};

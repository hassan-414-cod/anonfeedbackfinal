// DEV ONLY: drops and recreates the database. Run migrations + seeds afterwards (npm run db:reset does it).
require("dotenv").config({ path: require("path").join(__dirname, "../.env"), quiet: true });
const { Client } = require("pg");

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Refusing to reset a production database.");
  const url = new URL(process.env.DATABASE_URL);
  const dbName = decodeURIComponent(url.pathname.slice(1));
  url.pathname = "/postgres";
  const admin = new Client({ connectionString: url.toString() });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS "${dbName.replace(/"/g, '""')}" WITH (FORCE)`);
  await admin.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
  await admin.end();
  console.log(`Recreated database "${dbName}".`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

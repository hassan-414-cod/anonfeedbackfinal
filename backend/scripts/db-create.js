// Creates the database named in DATABASE_URL if it doesn't exist yet (Knex can't do this itself).
require("dotenv").config({ path: require("path").join(__dirname, "../.env"), quiet: true });
const { Client } = require("pg");

async function main() {
  const url = new URL(process.env.DATABASE_URL);
  const dbName = decodeURIComponent(url.pathname.slice(1));
  url.pathname = "/postgres";
  const admin = new Client({ connectionString: url.toString() });
  await admin.connect();
  const found = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (found.rowCount) console.log(`Database "${dbName}" already exists.`);
  else {
    await admin.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
    console.log(`Created database "${dbName}".`);
  }
  await admin.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

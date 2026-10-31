// Promote an account:  npm run make-admin -- you@example.com [admin|moderator|user]
const db = require("../src/db");

async function main() {
  const [email, role = "admin"] = process.argv.slice(2);
  if (!email || !["admin", "moderator", "user"].includes(role)) {
    console.error("Usage: npm run make-admin -- <email> [admin|moderator|user]");
    process.exit(1);
  }
  const n = await db("accounts").where({ email: email.trim().toLowerCase() }).update({ role });
  console.log(n ? `${email} is now ${role}.` : `No account found for ${email}.`);
  await db.destroy();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

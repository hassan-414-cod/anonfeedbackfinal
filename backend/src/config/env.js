const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env"), quiet: true });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Copy backend/.env.example to backend/.env and fill it in.");
  process.exit(1);
}

module.exports = {
  port: Number(process.env.PORT) || 4000,
  isProd: process.env.NODE_ENV === "production",
  frontendOrigins: (process.env.FRONTEND_ORIGIN || "http://localhost:3000").split(",").map((s) => s.trim()),
  uploadDir: path.resolve(__dirname, "../..", process.env.UPLOAD_DIR || "uploads"),
  demoBilling: process.env.DEMO_BILLING === "true",
};

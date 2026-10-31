const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const env = require("../config/env");
const { FREE_MAX_MB, PRO_MAX_MB } = require("../constants");
const { ApiError } = require("../utils/errors");
const { safeName } = require("../utils/uploads");
const { isPro } = require("../services/auth");

// Files stream straight to disk (no big buffers in memory). The size cap depends on the plan.
const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const dir = path.join(env.uploadDir, "projects", req.user.id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}-${safeName(file.originalname)}`),
});

const make = (mb) => multer({ storage, limits: { fileSize: mb * 1024 * 1024, files: 1 } }).single("file");
const freeUpload = make(FREE_MAX_MB);
const proUpload = make(PRO_MAX_MB);

// Requires req.user (put requireUser before this).
function uploadFile(req, res, next) {
  const mb = isPro(req.user) ? PRO_MAX_MB : FREE_MAX_MB;
  (isPro(req.user) ? proUpload : freeUpload)(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new ApiError(413, "file_too_large", `That file is over your ${mb}MB limit.${isPro(req.user) ? "" : " Upgrade to Pro for 500MB."}`));
    }
    if (err.name === "MulterError") return next(new ApiError(400, "bad_upload", "Invalid upload."));
    next(err);
  });
}

module.exports = { uploadFile };

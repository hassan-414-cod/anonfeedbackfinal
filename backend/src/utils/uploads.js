const path = require("path");

// Allowed uploads per project type. content_type comes from here, never from the client.
const UPLOAD_TYPES = {
  doc: {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
    md: "text/markdown",
  },
  image: { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp" },
  video: { mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime" },
};

// Types that are safe to render inline in the browser; everything else is forced to download.
const INLINE_SAFE = new Set([
  "application/pdf",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const ext = (name) => path.extname(name).slice(1).toLowerCase();
const safeName = (name) => name.replace(/[^\w.\-]/g, "_").slice(-100) || "file";

module.exports = { UPLOAD_TYPES, INLINE_SAFE, ext, safeName };

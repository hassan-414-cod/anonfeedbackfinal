const fs = require("fs");
const path = require("path");
const env = require("../config/env");

// Local-disk storage (development). Swap these functions for S3 / R2 calls in production;
// nothing else in the app touches the filesystem. Keys are relative paths like projects/<id>/<file>.

function fullPath(key) {
  const p = path.resolve(env.uploadDir, key);
  if (!p.startsWith(env.uploadDir + path.sep)) throw new Error("Bad storage key");
  return p;
}

const removeFile = (key) => fs.promises.rm(fullPath(key), { force: true });
const statFile = (key) => fs.promises.stat(fullPath(key));
const readStream = (key, range) => fs.createReadStream(fullPath(key), range);

module.exports = { removeFile, statFile, readStream };

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const env = require("./config/env");
const { originCheck } = require("./middleware/security");
const { loadUser } = require("./middleware/auth");
const { notFound, errorHandler } = require("./middleware/error");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1); // real client IP behind the Next.js proxy / a load balancer

app.use(cors({ origin: env.frontendOrigins, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "100kb" }));
app.use(originCheck);
app.use(loadUser);

app.use("/api", require("./routes"));

app.use(notFound);
app.use(errorHandler);

module.exports = app;

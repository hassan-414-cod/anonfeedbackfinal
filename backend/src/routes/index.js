const { Router } = require("express");

const router = Router();

router.use("/auth", require("./auth"));
router.use("/me", require("./me"));
router.use("/projects", require("./projects"));
router.use("/feedback", require("./feedback"));
router.use("/rooms", require("./rooms"));
router.use("/reports", require("./reports"));
router.use("/admin", require("./admin"));
router.use("/", require("./public")); // /leaderboard, /stats, /health

module.exports = router;

const express = require("express");
const requireAuth = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const { fearGreed, stockMetrics } = require("../controllers/marketController");

const router = express.Router();
router.use(requireAuth);
router.get("/fear-greed", asyncHandler(fearGreed));
router.get("/stock-metrics", asyncHandler(stockMetrics));

module.exports = router;

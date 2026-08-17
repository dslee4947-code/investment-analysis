const express = require("express");
const multer = require("multer");
const requireAuth = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const {
  listHoldings,
  createHolding,
  bulkCreateHoldings,
  updateHolding,
  deleteHolding,
  listSnapshots,
} = require("../controllers/holdingController");
const { parseImage } = require("../controllers/parseController");
const { getUsdKrw } = require("../controllers/fxController");
const { getNews } = require("../controllers/newsController");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = express.Router();

router.use(requireAuth);

router.get("/", asyncHandler(listHoldings));
router.post("/", asyncHandler(createHolding));
router.post("/bulk", asyncHandler(bulkCreateHoldings));
router.put("/:id", asyncHandler(updateHolding));
router.delete("/:id", asyncHandler(deleteHolding));
router.get("/snapshots", asyncHandler(listSnapshots));
router.get("/fx/usd-krw", asyncHandler(getUsdKrw));
router.post("/parse-image", upload.single("image"), asyncHandler(parseImage));
router.get("/:id/news", asyncHandler(getNews));

module.exports = router;

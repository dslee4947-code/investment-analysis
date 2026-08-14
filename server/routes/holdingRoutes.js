const express = require("express");
const multer = require("multer");
const requireAuth = require("../middleware/authMiddleware");
const {
  listHoldings,
  createHolding,
  bulkCreateHoldings,
  updateHolding,
  deleteHolding,
  listSnapshots,
} = require("../controllers/holdingController");
const { parseImage } = require("../controllers/parseController");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = express.Router();

router.use(requireAuth);

router.get("/", listHoldings);
router.post("/", createHolding);
router.post("/bulk", bulkCreateHoldings);
router.put("/:id", updateHolding);
router.delete("/:id", deleteHolding);
router.get("/snapshots", listSnapshots);
router.post("/parse-image", upload.single("image"), parseImage);

module.exports = router;

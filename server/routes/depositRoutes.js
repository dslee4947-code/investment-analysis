const express = require("express");
const requireAuth = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const { listDeposits, createDeposit, deleteDeposit } = require("../controllers/depositController");

const router = express.Router();
router.use(requireAuth);

router.get("/", asyncHandler(listDeposits));
router.post("/", asyncHandler(createDeposit));
router.delete("/:id", asyncHandler(deleteDeposit));

module.exports = router;

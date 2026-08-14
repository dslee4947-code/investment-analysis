const mongoose = require("mongoose");

const snapshotSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // YYYY-MM-DD, one per day
  totalValue: { type: Number, required: true },
  totalCost: { type: Number, required: true },
});

module.exports = mongoose.model("Snapshot", snapshotSchema);

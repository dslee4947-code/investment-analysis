const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    amount: { type: Number, required: true }, // KRW
    memo: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Deposit", depositSchema);

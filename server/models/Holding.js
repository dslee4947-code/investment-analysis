const mongoose = require("mongoose");

const holdingSchema = new mongoose.Schema(
  {
    ticker: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    market: {
      type: String,
      enum: ["국내", "미국", "암호화폐", "기타"],
      default: "국내",
    },
    assetType: {
      type: String,
      enum: ["주식", "ETF", "현금", "채권", "암호화폐", "기타"],
      default: "주식",
    },
    quantity: { type: Number, required: true, default: 0 },
    avgBuyPrice: { type: Number, required: true, default: 0 },
    currentPrice: { type: Number, required: true, default: 0 },
    currency: { type: String, enum: ["KRW", "USD"], default: "KRW" },
    account: { type: String, trim: true },
    memo: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Holding", holdingSchema);

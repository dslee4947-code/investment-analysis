const mongoose = require("mongoose");

const newsItemSchema = new mongoose.Schema(
  {
    text: String,
    sentiment: { type: String, enum: ["positive", "negative", "neutral"] },
    url: String,
  },
  { _id: false }
);

const newsReportSchema = new mongoose.Schema({
  key: { type: String, required: true }, // 티커 또는 종목명 (계좌 중복 제거용)
  date: { type: String, required: true }, // YYYY-MM-DD
  items: [newsItemSchema],
  generatedAt: { type: Number, required: true },
});

newsReportSchema.index({ key: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("NewsReport", newsReportSchema);

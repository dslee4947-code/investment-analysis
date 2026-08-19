const Holding = require("../models/Holding");
const NewsReport = require("../models/NewsReport");
const { generateNewsItems, holdingKey } = require("../utils/newsGenerator");

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function getNews(req, res) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ message: "서버에 ANTHROPIC_API_KEY가 설정되어 있지 않습니다." });
  }

  const holding = await Holding.findById(req.params.id);
  if (!holding) {
    return res.status(404).json({ message: "종목을 찾을 수 없습니다." });
  }

  const key = holdingKey(holding);
  const date = todayKey();

  const existing = await NewsReport.findOne({ key, date });
  if (existing) {
    return res.json({ items: existing.items, fetchedAt: existing.generatedAt, cached: true });
  }

  // 오늘 자동 리포트가 아직 없으면(예: 새로 추가된 종목) 지금 생성해서 저장해둔다
  const items = await generateNewsItems(holding);
  const generatedAt = Date.now();

  await NewsReport.findOneAndUpdate(
    { key, date },
    { key, date, items, generatedAt },
    { upsert: true }
  );

  res.json({ items, fetchedAt: generatedAt, cached: false });
}

module.exports = { getNews };

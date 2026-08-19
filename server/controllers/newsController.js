const Holding = require("../models/Holding");
const NewsReport = require("../models/NewsReport");
const { holdingKey } = require("../utils/newsGenerator");

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// 종목 클릭 시 그 자리에서 AI를 호출하지 않는다.
// 매일 아침 dailyNewsJob이 미리 생성해 둔 리포트만 조회해서 즉시 보여준다.
async function getNews(req, res) {
  const holding = await Holding.findById(req.params.id);
  if (!holding) {
    return res.status(404).json({ message: "종목을 찾을 수 없습니다." });
  }

  const key = holdingKey(holding);
  const date = todayKey();

  const today = await NewsReport.findOne({ key, date });
  if (today) {
    return res.json({ items: today.items, fetchedAt: today.generatedAt, cached: true });
  }

  // 오늘자 리포트가 아직 없으면(예: 새로 추가된 종목, 배치 실행 전) 가장 최근 리포트를 대신 보여준다
  const latest = await NewsReport.findOne({ key }).sort({ date: -1 });
  if (latest) {
    return res.json({ items: latest.items, fetchedAt: latest.generatedAt, cached: true, stale: true });
  }

  res.json({ items: [], fetchedAt: null, cached: false, pending: true });
}

module.exports = { getNews };

const { getFearGreedIndex } = require("../utils/fearGreed");
const { getMetricsForTickers } = require("../utils/stockMetrics");

async function fearGreed(req, res) {
  const data = await getFearGreedIndex();
  if (!data) {
    return res.status(502).json({ message: "공포탐욕지수를 가져오지 못했습니다." });
  }
  res.json(data);
}

async function stockMetrics(req, res) {
  const tickers = (req.query.tickers || "").split(",").map((t) => t.trim()).filter(Boolean);
  if (tickers.length === 0) {
    return res.json({});
  }
  const data = await getMetricsForTickers(tickers);
  res.json(data);
}

module.exports = { fearGreed, stockMetrics };

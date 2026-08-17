const YahooFinance = require("yahoo-finance2").default;
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const cache = new Map(); // ticker -> { data, fetchedAt }
const CACHE_MS = 60 * 60 * 1000; // 1시간 캐시

function calculateRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round((100 - 100 / (1 + rs)) * 10) / 10;
}

async function getMetricsForTicker(ticker) {
  const now = Date.now();
  const hit = cache.get(ticker);
  if (hit && now - hit.fetchedAt < CACHE_MS) {
    return hit.data;
  }

  try {
    const period1 = new Date(now - 120 * 24 * 60 * 60 * 1000); // 최근 120일
    const [quote, chart] = await Promise.all([
      yf.quote(ticker),
      yf.chart(ticker, { period1, interval: "1d" }),
    ]);

    const closes = chart.quotes.map((q) => q.close).filter((c) => typeof c === "number");
    const rsi = calculateRSI(closes);

    const week52High = quote.fiftyTwoWeekHigh;
    const week52Low = quote.fiftyTwoWeekLow;
    const price = quote.regularMarketPrice;
    const positionPct =
      week52High && week52Low && week52High !== week52Low
        ? Math.round(((price - week52Low) / (week52High - week52Low)) * 1000) / 10
        : null;

    const data = { ticker, price, week52High, week52Low, positionPct, rsi };
    cache.set(ticker, { data, fetchedAt: now });
    return data;
  } catch (err) {
    console.error(`시세 조회 실패 (${ticker}):`, err.message);
    return { ticker, error: true };
  }
}

async function getMetricsForTickers(tickers) {
  const unique = [...new Set(tickers.filter(Boolean))];
  const results = await Promise.all(unique.map((t) => getMetricsForTicker(t)));
  const map = {};
  results.forEach((r) => {
    map[r.ticker] = r;
  });
  return map;
}

module.exports = { getMetricsForTickers };

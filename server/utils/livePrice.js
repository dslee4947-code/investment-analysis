const YahooFinance = require("yahoo-finance2").default;
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const { getUsdKrwRate } = require("./fx");

// Yahoo에서 티커만으로 조회하면 이름이 비슷한 완전히 다른(가짜/잡)코인이 잡히는 경우가 있어서,
// 실제로 맞는 코인인지 하나하나 확인된 것만 여기 추가한다. (검증 안 된 티커는 자동갱신 생략)
const VERIFIED_CRYPTO_TICKERS = new Set([
  "XRP",
  "ETH",
  "BTC",
  "SOL",
  "BCH",
  "DOGE",
  "SHIB",
  "INJ",
  "LINK",
  "AAVE",
  "AVAX",
  "1INCH",
  "USDT",
]);

const cache = new Map(); // cacheKey -> { price, fetchedAt }
const CACHE_MS = 60 * 60 * 1000; // 1시간

async function fetchLivePrice(holding) {
  if (!holding.ticker) return null;

  if (holding.assetType === "암호화폐") {
    if (!VERIFIED_CRYPTO_TICKERS.has(holding.ticker.toUpperCase())) return null;
    const quote = await yf.quote(`${holding.ticker}-USD`);
    const usdPrice = quote.regularMarketPrice;
    if (!usdPrice) return null;
    if (holding.currency === "USD") return usdPrice;
    const rate = await getUsdKrwRate();
    return Math.round(usdPrice * rate);
  }

  if (holding.assetType === "주식" || holding.assetType === "ETF") {
    const quote = await yf.quote(holding.ticker);
    return quote.regularMarketPrice || null;
  }

  return null;
}

async function getCachedLivePrice(holding) {
  const cacheKey = `${holding.assetType}:${holding.ticker}:${holding.currency}`;
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && now - hit.fetchedAt < CACHE_MS) {
    return hit.price;
  }

  try {
    const price = await fetchLivePrice(holding);
    cache.set(cacheKey, { price, fetchedAt: now });
    return price;
  } catch (err) {
    console.error(`실시간 시세 조회 실패 (${holding.name}):`, err.message);
    return null;
  }
}

// holdings 배열을 받아 실시간 시세로 갱신 가능한 것만 DB에 반영하고,
// { updatedCount, skipped: [{name, reason}] } 요약을 반환한다.
async function syncLivePrices(holdings) {
  const skipped = [];
  let updatedCount = 0;

  await Promise.all(
    holdings.map(async (h) => {
      if (!h.ticker) {
        skipped.push({ name: h.name, reason: "티커 없음" });
        return;
      }
      if (h.assetType === "암호화폐" && !VERIFIED_CRYPTO_TICKERS.has(h.ticker.toUpperCase())) {
        skipped.push({ name: h.name, reason: "티커 검증 안 됨" });
        return;
      }
      if (!["주식", "ETF", "암호화폐"].includes(h.assetType)) {
        return; // 현금 등은 대상 아님
      }

      const price = await getCachedLivePrice(h);
      if (price != null && price !== h.currentPrice) {
        h.currentPrice = price;
        await h.save();
        updatedCount++;
      }
    })
  );

  return { updatedCount, skipped };
}

module.exports = { syncLivePrices, VERIFIED_CRYPTO_TICKERS };

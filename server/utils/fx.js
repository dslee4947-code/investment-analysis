let cached = { rate: null, fetchedAt: 0 };
const CACHE_MS = 60 * 60 * 1000; // 1시간 캐시

async function getUsdKrwRate() {
  const now = Date.now();
  if (cached.rate && now - cached.fetchedAt < CACHE_MS) {
    return cached.rate;
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();
    const rate = data?.rates?.KRW;
    if (typeof rate === "number") {
      cached = { rate, fetchedAt: now };
      return rate;
    }
  } catch (err) {
    console.error("환율 조회 실패:", err.message);
  }

  // API 실패 시 이전에 캐시된 값이라도 반환, 아예 없으면 대략치로 폴백
  return cached.rate || 1400;
}

module.exports = { getUsdKrwRate };

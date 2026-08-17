let cached = { data: null, fetchedAt: 0 };
const CACHE_MS = 60 * 60 * 1000; // 1시간 캐시

async function getFearGreedIndex() {
  const now = Date.now();
  if (cached.data && now - cached.fetchedAt < CACHE_MS) {
    return cached.data;
  }

  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1");
    const json = await res.json();
    const item = json?.data?.[0];
    if (item) {
      const data = {
        value: Number(item.value),
        classification: item.value_classification,
        timestamp: Number(item.timestamp) * 1000,
      };
      cached = { data, fetchedAt: now };
      return data;
    }
  } catch (err) {
    console.error("공포탐욕지수 조회 실패:", err.message);
  }

  return cached.data;
}

module.exports = { getFearGreedIndex };

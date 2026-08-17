const Anthropic = require("@anthropic-ai/sdk");
const Holding = require("../models/Holding");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const cache = new Map(); // holdingId -> { items, fetchedAt }
const CACHE_MS = 24 * 60 * 60 * 1000; // 24시간 캐시

const SYSTEM_PROMPT = `너는 투자자를 위한 종목 뉴스 요약 도구다.
주어진 종목에 대한 최근 뉴스를 웹 검색으로 찾아서, 아래 JSON 배열 형식으로만 응답해라.
마크다운 코드블록이나 설명 문장 없이 순수 JSON 배열만 출력해라.

[
  {
    "text": "한국어 한 문장 요약",
    "sentiment": "positive 또는 negative 또는 neutral",
    "url": "기사 원문 URL"
  }
]

규칙:
- 웹검색은 딱 1번만 해라. 검색 결과 안에서 2~4개 뉴스를 골라 요약해라 (추가 검색 금지, 속도가 중요하다)
- 2~4개 항목만 만들어라
- 사실 기반으로만 요약해라 (실적, 계약, 인사, 규제, 시장 동향 등)
- "매수하세요", "매도하세요", "지금이 저평가/고평가입니다" 같은 투자 판단이나 추천 문구는 절대 쓰지 마라
- sentiment는 이 뉴스가 주가에 호재/긍정적 영향을 줄 것으로 보이면 "positive", 악재/부정적이면 "negative",
  판단하기 애매하거나 중립적이면 "neutral"로 표시해라
- url은 실제 검색된 기사의 원문 링크를 그대로 넣어라 (지어내지 마라)
- 관련 뉴스를 찾지 못하면 빈 배열 []을 반환해라`;

async function getNews(req, res) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ message: "서버에 ANTHROPIC_API_KEY가 설정되어 있지 않습니다." });
  }

  const holding = await Holding.findById(req.params.id);
  if (!holding) {
    return res.status(404).json({ message: "종목을 찾을 수 없습니다." });
  }

  const now = Date.now();
  const cached = cache.get(req.params.id);
  if (cached && now - cached.fetchedAt < CACHE_MS) {
    return res.json({ ...cached, cached: true });
  }

  const query = `${holding.name}${holding.ticker ? ` (${holding.ticker})` : ""} - ${holding.market} ${holding.assetType}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 1 }],
    messages: [{ role: "user", content: `"${query}"의 최근 뉴스를 요약해줘.` }],
  });

  const textBlock = [...message.content].reverse().find((b) => b.type === "text");
  let items = [];
  try {
    const raw = textBlock ? textBlock.text.trim() : "[]";
    const jsonStr = raw.startsWith("[") ? raw : raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1);
    items = JSON.parse(jsonStr);
  } catch (err) {
    items = [];
  }

  const result = { items, fetchedAt: now };
  cache.set(req.params.id, result);
  res.json({ ...result, cached: false });
}

module.exports = { getNews };

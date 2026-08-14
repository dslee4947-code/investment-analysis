const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `너는 증권사 앱 스크린샷에서 보유 종목 정보를 추출하는 도구다.
이미지에서 각 보유 종목의 종목명, 티커(있으면), 수량, 평균매입가, 현재가(또는 평가금액에서 역산 가능하면 계산)를 읽어
아래 JSON 스키마의 배열로만 응답해라. 설명 문장은 절대 붙이지 마라.

[
  {
    "name": "종목명",
    "ticker": "티커 또는 빈 문자열",
    "quantity": 숫자,
    "avgBuyPrice": 숫자,
    "currentPrice": 숫자,
    "currency": "KRW 또는 USD",
    "assetType": "주식 또는 ETF 또는 현금 또는 채권 또는 암호화폐 또는 기타",
    "market": "국내 또는 미국 또는 암호화폐 또는 기타"
  }
]

숫자를 읽을 수 없는 항목은 0으로 채우고, 확신이 없어도 이미지에 보이는 대로 최선을 다해 추출해라.`;

async function parseImage(req, res) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ message: "서버에 ANTHROPIC_API_KEY가 설정되어 있지 않습니다." });
  }
  if (!req.file) {
    return res.status(400).json({ message: "이미지 파일이 필요합니다." });
  }

  const base64 = req.file.buffer.toString("base64");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: req.file.mimetype, data: base64 },
          },
          { type: "text", text: "이 스크린샷에서 보유 종목을 추출해줘." },
        ],
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  let items = [];
  try {
    const raw = textBlock ? textBlock.text.trim() : "[]";
    const jsonStr = raw.startsWith("[") ? raw : raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1);
    items = JSON.parse(jsonStr);
  } catch (err) {
    return res.status(502).json({ message: "이미지 분석 결과를 해석하지 못했습니다.", raw: textBlock?.text });
  }

  res.json({ items });
}

module.exports = { parseImage };

const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `너는 증권사 앱 스크린샷에서 보유 종목 정보를 추출하는 도구다.
이미지에서 각 보유 종목의 종목명, 티커(있으면), 수량, 평균매입가, 현재가를 읽고,
화면에 "예수금", "예수금(현금)", "출금가능금액" 같은 현금 잔고가 표시되어 있으면 그것도 함께 추출해서
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

중요 - avgBuyPrice와 currentPrice는 반드시 "1주(1개)당 가격"이어야 한다.
- 화면에 "매입금액", "평가금액"처럼 수량 전체를 곱한 총액만 표시된 경우, 반드시 (총액 ÷ 수량)으로 계산해서
  1주당 가격으로 환산한 값을 넣어라. 총액을 그대로 avgBuyPrice/currentPrice에 넣지 마라.
- 반대로 화면에 이미 1주당 단가가 표시되어 있다면 그 값을 그대로 사용해라.
- 국내 탭/해외 탭 여부, $ 표시, 종목별 가격대(예: 미국 개별주는 보통 수십~수백 달러) 등을 참고해서
  currency와 market을 정확히 판단해라. 해외 탭에 있는 종목은 보통 currency: "USD", market: "미국"이다.

현금(예수금) 처리 규칙:
- 예수금/현금 잔고가 화면에 보이면, name: "현금", ticker: "", quantity: 1, avgBuyPrice와 currentPrice는
  둘 다 그 현금 금액과 동일하게, assetType: "현금", market: "국내" 또는 해당 통화 기준으로 넣어서
  배열에 포함시켜라 (0원이어도 포함해도 되고, 아예 안 보이면 넣지 마라).
- 현금은 보통 종목 목록과 별도 영역(계좌 요약 등)에 표시되니 놓치지 말고 확인해라.

숫자를 읽을 수 없는 항목은 0으로 채우고, 확신이 없어도 이미지에 보이는 대로 최선을 다해 추출해라.
마크다운 코드블록(\`\`\`)으로 감싸지 말고 JSON 배열 텍스트만 그대로 출력해라.`;

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 529]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function createMessageWithRetry(params, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await anthropic.messages.create(params);
    } catch (err) {
      const isRetryable = RETRYABLE_STATUS.has(err?.status);
      if (!isRetryable || attempt === retries) throw err;
      await sleep(1000 * 2 ** attempt); // 1s, 2s, 4s
    }
  }
}

async function parseImage(req, res) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ message: "서버에 ANTHROPIC_API_KEY가 설정되어 있지 않습니다." });
  }
  if (!req.file) {
    return res.status(400).json({ message: "이미지 파일이 필요합니다." });
  }

  const base64 = req.file.buffer.toString("base64");

  let message;
  try {
    message = await createMessageWithRetry({
      model: "claude-sonnet-5",
      max_tokens: 8192,
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
  } catch (err) {
    if (RETRYABLE_STATUS.has(err?.status)) {
      return res
        .status(503)
        .json({ message: "AI 서비스가 지금 일시적으로 혼잡합니다. 잠시 후 다시 시도해주세요." });
    }
    throw err;
  }

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

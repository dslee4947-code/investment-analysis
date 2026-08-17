import { useEffect, useState } from "react";
import api from "../api/client";

function formatNumber(v) {
  return Number(v || 0).toLocaleString("ko-KR");
}

function rsiColor(rsi) {
  if (rsi >= 70) return "text-[#d03b3b]";
  if (rsi <= 30) return "text-[#2a78d6]";
  return "text-neutral-900 dark:text-white";
}

function SentimentIcon({ sentiment }) {
  if (sentiment === "positive") {
    return (
      <span className="text-[#0ca30c] font-bold shrink-0" title="주가에 긍정적일 수 있는 소식">
        ▲
      </span>
    );
  }
  if (sentiment === "negative") {
    return (
      <span className="text-[#d03b3b] font-bold shrink-0" title="주가에 부정적일 수 있는 소식">
        ▼
      </span>
    );
  }
  return (
    <span className="text-neutral-400 font-bold shrink-0" title="영향이 뚜렷하지 않은 소식">
      —
    </span>
  );
}

function timeAgo(ts) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.round(hours / 24)}일 전`;
}

function analyzeRSI(rsi) {
  if (rsi == null) {
    return "이 종목은 RSI를 계산할 시세 데이터가 없습니다 (국내 종목은 정확한 종목코드를 티커에 등록해야 조회됩니다).";
  }
  if (rsi >= 70) {
    return `현재 RSI ${rsi}로 70 이상인 "과매수" 구간입니다. 최근 14일간 상승폭이 하락폭보다 훨씬 커서, 단기적으로 상승세가 강했다는 의미입니다. 이 구간에서는 일부 투자자들이 단기 조정 가능성을 참고하기도 하지만, 강한 상승장에서는 RSI가 70 위에서 오래 머무는 경우도 흔합니다.`;
  }
  if (rsi <= 30) {
    return `현재 RSI ${rsi}로 30 이하인 "과매도" 구간입니다. 최근 14일간 하락폭이 상승폭보다 훨씬 커서, 단기적으로 하락세가 강했다는 의미입니다. 이 구간에서는 단기 반등 가능성을 참고하는 투자자들이 있지만, 하락 추세가 계속되면 30 아래에서 더 내려가는 경우도 있습니다.`;
  }
  return `현재 RSI ${rsi}로 30~70 사이 "중립" 구간입니다. 최근 상승폭과 하락폭이 어느 한쪽으로 크게 치우치지 않았다는 뜻으로, 과열이나 침체 신호는 특별히 없는 상태입니다.`;
}

function analyzePosition(metrics) {
  if (!metrics || metrics.positionPct == null) return null;
  const pct = metrics.positionPct;
  let desc;
  if (pct >= 90) {
    desc = `52주 최고가(${formatNumber(metrics.week52High)})에 거의 근접한 신고가권입니다.`;
  } else if (pct <= 10) {
    desc = `52주 최저가(${formatNumber(metrics.week52Low)})에 거의 근접한 바닥권입니다.`;
  } else if (pct >= 50) {
    desc = `52주 범위 중간보다 위쪽(고점 쪽)에 위치해 있습니다.`;
  } else {
    desc = `52주 범위 중간보다 아래쪽(저점 쪽)에 위치해 있습니다.`;
  }
  return `52주 최저 ${formatNumber(metrics.week52Low)} ~ 최고 ${formatNumber(
    metrics.week52High
  )} 범위에서 현재가는 ${pct}% 지점입니다 (0%=52주 최저가, 100%=52주 최고가). ${desc}`;
}

export default function StockDetailModal({ holding, metrics, fxRate = 0, onClose }) {
  const [news, setNews] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showExplain, setShowExplain] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get(`/holdings/${holding._id}/news`)
      .then((res) => setNews(res.data))
      .catch((err) => setError(err.response?.data?.message || "뉴스를 가져오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [holding._id]);

  const cost = holding.quantity * holding.avgBuyPrice;
  const value = holding.quantity * holding.currentPrice;
  const pnl = value - cost;
  const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
  const pnlColor = pnl >= 0 ? "text-[#006300] dark:text-[#0ca30c]" : "text-[#d03b3b]";

  const items = Array.isArray(news?.items) ? news.items : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-neutral-900 shadow-xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{holding.name}</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {holding.market} · {holding.assetType} {holding.ticker && `· ${holding.ticker}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-3 mb-4">
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">현재가</div>
            <div className="text-sm font-semibold text-neutral-900 dark:text-white tabular-nums">
              {formatNumber(holding.currentPrice)}
            </div>
          </div>
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">평가손익</div>
            <div className={`text-sm font-semibold tabular-nums ${pnlColor}`}>{pnlPct.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">RSI</div>
            <div
              className={`text-sm font-semibold tabular-nums ${
                metrics?.rsi != null ? rsiColor(metrics.rsi) : "text-neutral-400"
              }`}
            >
              {metrics?.rsi != null ? metrics.rsi : "-"}
            </div>
          </div>
        </div>
        {metrics?.positionPct != null && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 -mt-2 mb-2 text-center">
            52주위치 {metrics.positionPct}% (52주 최고 {formatNumber(metrics.week52High)} · 최저{" "}
            {formatNumber(metrics.week52Low)})
          </p>
        )}

        <button
          onClick={() => setShowExplain((v) => !v)}
          className="w-full text-center text-xs text-[#2a78d6] hover:underline mb-4"
        >
          RSI·52주위치 설명 {showExplain ? "접기" : "보기"}
        </button>

        {showExplain && (
          <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-3 mb-4 space-y-3 text-xs text-neutral-600 dark:text-neutral-300">
            <div>
              <p className="font-semibold text-neutral-900 dark:text-white mb-1">RSI (상대강도지수)</p>
              <p className="mb-1">
                최근 14일간의 상승폭과 하락폭을 비교해 0~100 사이 숫자로 나타낸 지표입니다. 상승폭 비중이
                클수록 100에, 하락폭 비중이 클수록 0에 가까워집니다.
              </p>
              <p>{analyzeRSI(metrics?.rsi)}</p>
            </div>
            {analyzePosition(metrics) && (
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
                <p className="font-semibold text-neutral-900 dark:text-white mb-1">52주위치</p>
                <p className="mb-1">
                  최근 52주(1년)간의 최고가·최저가 범위 안에서 현재가가 어디쯤 있는지를 %로 나타낸
                  지표입니다.
                </p>
                <p>{analyzePosition(metrics)}</p>
              </div>
            )}
            <p className="pt-2 border-t border-neutral-200 dark:border-neutral-700 text-neutral-400">
              두 지표 모두 과거 가격 움직임만 보는 참고 지표이며, 매수·매도를 판단하는 절대적인 기준이
              아닙니다.
            </p>
          </div>
        )}

        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">최근 뉴스</h3>
        {loading && <p className="text-sm text-neutral-500 dark:text-neutral-400">뉴스를 검색하는 중...</p>}
        {error && <p className="text-sm text-[#d03b3b]">{error}</p>}
        {!loading && !error && items.length === 0 && news && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">최근 특별한 뉴스를 찾지 못했습니다.</p>
        )}
        {!loading && !error && items.length > 0 && (
          <ul className="space-y-2.5 text-sm text-neutral-700 dark:text-neutral-200">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <SentimentIcon sentiment={item.sentiment} />
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline hover:text-[#2a78d6]"
                  >
                    {item.text}
                  </a>
                ) : (
                  <span>{item.text}</span>
                )}
              </li>
            ))}
          </ul>
        )}
        {!loading && !error && news && (
          <p className="mt-3 text-xs text-neutral-400">
            {timeAgo(news.fetchedAt)} 갱신{news.cached && " (캐시됨)"} · ▲긍정적 ▼부정적 —중립 · AI
            웹검색 요약이며 투자 조언이 아닙니다. 뉴스 클릭 시 원문으로 이동합니다.
          </p>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import api from "../api/client";

const LABELS = {
  "Extreme Fear": "극단적 공포",
  Fear: "공포",
  Neutral: "중립",
  Greed: "탐욕",
  "Extreme Greed": "극단적 탐욕",
};

function zoneColor(value) {
  if (value <= 24) return "#d03b3b";
  if (value <= 44) return "#eb6834";
  if (value <= 55) return "#eda100";
  if (value <= 75) return "#1baf7a";
  return "#0ca30c";
}

export default function FearGreedCard({ bare = false }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/market/fear-greed")
      .then((res) => setData(res.data))
      .catch(() => setError("공포·탐욕지수를 불러오지 못했습니다."));
  }, []);

  const wrapperClass = bare ? "" : "rounded-2xl bg-white dark:bg-neutral-900 shadow p-5";

  return (
    <div className={wrapperClass}>
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">비트코인 공포·탐욕지수</h2>

      {error && <p className="text-sm text-neutral-500 dark:text-neutral-400">{error}</p>}

      {!error && !data && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">불러오는 중...</p>
      )}

      {data && (
        <>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold tabular-nums" style={{ color: zoneColor(data.value) }}>
              {data.value}
            </div>
            <div>
              <div className="text-base font-semibold" style={{ color: zoneColor(data.value) }}>
                {LABELS[data.classification] || data.classification}
              </div>
              <div className="text-xs text-neutral-400">
                {new Date(data.timestamp).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })} 기준
              </div>
            </div>
          </div>

          <div className="mt-4 relative">
            <div
              className="h-2 rounded-full"
              style={{
                background: "linear-gradient(to right, #d03b3b, #eb6834, #eda100, #1baf7a, #0ca30c)",
              }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-neutral-900 dark:bg-white rounded"
              style={{ left: `calc(${Math.min(100, Math.max(0, data.value))}% - 2px)` }}
            />
          </div>
          <div className="flex justify-between text-xs text-neutral-400 mt-1">
            <span>공포</span>
            <span>탐욕</span>
          </div>

          <p className="mt-3 text-xs text-neutral-400">
            alternative.me 제공 지수이며 참고용 정보입니다. 매수·매도 판단 기준이 아닙니다.
          </p>
        </>
      )}
    </div>
  );
}

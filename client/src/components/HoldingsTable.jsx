import { useState } from "react";
import { ACCOUNT_PRESETS } from "../constants";
import Select from "./Select";
import StockDetailModal from "./StockDetailModal";

function formatNumber(v) {
  return Number(v || 0).toLocaleString("ko-KR");
}

function formatKRWFloor(v) {
  return Math.floor(Number(v) || 0).toLocaleString("ko-KR");
}

function rsiColor(rsi) {
  if (rsi >= 70) return "text-[#d03b3b]";
  if (rsi <= 30) return "text-[#2a78d6]";
  return "text-neutral-900 dark:text-white";
}

function fearGreedColor(value) {
  if (value <= 24) return "#d03b3b";
  if (value <= 44) return "#eb6834";
  if (value <= 55) return "#eda100";
  if (value <= 75) return "#1baf7a";
  return "#0ca30c";
}

const FEAR_GREED_LABELS = {
  "Extreme Fear": "극단적 공포",
  Fear: "공포",
  Neutral: "중립",
  Greed: "탐욕",
  "Extreme Greed": "극단적 탐욕",
};

export default function HoldingsTable({
  holdings,
  onEdit,
  onDelete,
  onAccountChange,
  fxRate = 0,
  stockMetrics = {},
  fearGreed = null,
}) {
  const [collapsed, setCollapsed] = useState({});
  const [selected, setSelected] = useState(null);

  if (holdings.length === 0) {
    return (
      <div className="text-sm text-neutral-500 dark:text-neutral-400 py-8 text-center">
        아직 등록된 종목이 없습니다. 아래에서 추가해보세요.
      </div>
    );
  }

  const toKRW = (h, price) => (h.currency === "USD" ? h.quantity * price * fxRate : h.quantity * price);

  const groupOrder = [
    ...ACCOUNT_PRESETS,
    ...new Set(holdings.map((h) => h.account).filter((a) => a && !ACCOUNT_PRESETS.includes(a))),
    "미지정",
  ];

  const groups = groupOrder
    .map((name) => {
      const items = holdings
        .filter((h) => (name === "미지정" ? !h.account : h.account === name))
        .sort((a, b) => toKRW(b, b.currentPrice) - toKRW(a, a.currentPrice));
      const total = items.reduce((s, h) => s + toKRW(h, h.currentPrice), 0);
      return { name, items, total };
    })
    .filter((g) => g.items.length > 0);

  function toggle(name) {
    setCollapsed((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  const stickyHeadClass =
    "py-2 pr-3 font-medium whitespace-nowrap sticky top-0 z-20 bg-white dark:bg-neutral-900";

  return (
    <div className="overflow-auto max-h-[520px]">
      <table className="w-full text-sm min-w-[760px]">
        <thead>
          <tr className="text-left text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
            <th
              className={`${stickyHeadClass} left-0 z-30 border-r border-neutral-200 dark:border-neutral-800`}
            >
              종목
            </th>
            <th className={`${stickyHeadClass} text-right`}>RSI</th>
            <th className={`${stickyHeadClass} text-right`}>52주위치</th>
            <th className={`${stickyHeadClass} text-right`}>평균매입가</th>
            <th className={`${stickyHeadClass} text-right`}>현재가</th>
            <th className={`${stickyHeadClass} text-right`}>평가금액</th>
            <th className={`${stickyHeadClass} text-right`}>평가손익</th>
            <th className={`${stickyHeadClass} text-right`}>수익률</th>
            <th className={`${stickyHeadClass} text-right`}>수량</th>
            <th className={stickyHeadClass}>계좌</th>
            <th className={stickyHeadClass}></th>
          </tr>
        </thead>
        {groups.map((g) => (
          <tbody key={g.name} className="border-t-2 border-neutral-200 dark:border-neutral-700">
            <tr
              onClick={() => toggle(g.name)}
              className="cursor-pointer select-none bg-neutral-100 dark:bg-neutral-800/60 hover:bg-neutral-200 dark:hover:bg-neutral-800"
            >
              <td colSpan={11} className="py-2 px-3">
                <span className="font-semibold text-neutral-900 dark:text-white">
                  <span className="inline-block w-3 mr-1">{collapsed[g.name] ? "▶" : "▼"}</span>
                  {g.name} <span className="text-neutral-400 font-normal">({g.items.length})</span>
                </span>
                <span className="ml-3 font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">
                  {formatKRWFloor(g.total)}원
                </span>
                {g.name === "비트코인" && fearGreed && (
                  <span
                    className="ml-3 text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      color: fearGreedColor(fearGreed.value),
                      backgroundColor: `${fearGreedColor(fearGreed.value)}22`,
                    }}
                  >
                    탐욕지수 {fearGreed.value} · {FEAR_GREED_LABELS[fearGreed.classification] || fearGreed.classification}
                  </span>
                )}
              </td>
            </tr>
            {!collapsed[g.name] &&
              g.items.map((h) => {
                const cost = h.quantity * h.avgBuyPrice;
                const value = h.quantity * h.currentPrice;
                const valueKRW = toKRW(h, h.currentPrice);
                const pnl = value - cost;
                const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
                const pnlColor = pnl >= 0 ? "text-[#006300] dark:text-[#0ca30c]" : "text-[#d03b3b]";
                const metrics = h.ticker ? stockMetrics[h.ticker] : null;
                return (
                  <tr key={h._id} className="border-b border-neutral-100 dark:border-neutral-800/60">
                    <td
                      onClick={() => setSelected(h)}
                      className="py-2 pr-3 w-28 max-w-28 sticky left-0 z-10 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 cursor-pointer"
                    >
                      <div
                        className="font-medium text-neutral-900 dark:text-white truncate hover:underline"
                        title={h.name}
                      >
                        {h.name}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        {h.market} · {h.assetType}
                      </div>
                    </td>
                    <td className={`py-2 pr-3 text-right tabular-nums whitespace-nowrap ${metrics?.rsi != null ? rsiColor(metrics.rsi) : "text-neutral-400"}`}>
                      {metrics?.rsi != null ? metrics.rsi : "-"}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap text-neutral-900 dark:text-white">
                      {metrics?.positionPct != null ? `${metrics.positionPct}%` : "-"}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap text-neutral-900 dark:text-white">
                      {formatNumber(h.avgBuyPrice)}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap text-neutral-900 dark:text-white">
                      {formatNumber(h.currentPrice)}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap text-neutral-900 dark:text-white">
                      {formatKRWFloor(valueKRW)}원
                    </td>
                    <td className={`py-2 pr-3 text-right tabular-nums whitespace-nowrap ${pnlColor}`}>
                      {formatNumber(pnl)}
                      {h.currency === "USD" && fxRate > 0 && (
                        <div className="text-xs opacity-70">≈ {formatNumber(pnl * fxRate)}원</div>
                      )}
                    </td>
                    <td className={`py-2 pr-3 text-right tabular-nums whitespace-nowrap ${pnlColor}`}>
                      {pnlPct.toFixed(1)}%
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap text-neutral-900 dark:text-white">
                      {formatNumber(h.quantity)}
                    </td>
                    <td className="py-2 pr-3">
                      <Select
                        value={h.account || ""}
                        onChange={(v) => onAccountChange(h._id, v)}
                        options={[
                          { value: "", label: "미지정" },
                          ...ACCOUNT_PRESETS.map((a) => ({ value: a, label: a })),
                          ...(h.account && !ACCOUNT_PRESETS.includes(h.account)
                            ? [{ value: h.account, label: h.account }]
                            : []),
                        ]}
                        buttonClassName="rounded border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-600 dark:text-neutral-300 text-xs py-1 px-1.5"
                      />
                    </td>
                    <td className="py-2 pr-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => onEdit(h)}
                        className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white mr-2"
                      >
                        수정
                      </button>
                      <button onClick={() => onDelete(h._id)} className="text-xs text-[#d03b3b] hover:opacity-80">
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        ))}
      </table>
      {selected && (
        <StockDetailModal
          holding={selected}
          metrics={selected.ticker ? stockMetrics[selected.ticker] : null}
          fxRate={fxRate}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

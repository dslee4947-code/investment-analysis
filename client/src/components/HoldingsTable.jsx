function formatNumber(v) {
  return Number(v || 0).toLocaleString("ko-KR");
}

export default function HoldingsTable({ holdings, onEdit, onDelete }) {
  if (holdings.length === 0) {
    return (
      <div className="text-sm text-neutral-500 dark:text-neutral-400 py-8 text-center">
        아직 등록된 종목이 없습니다. 아래에서 추가해보세요.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="text-left text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
            <th className="py-2 pr-3 font-medium">종목</th>
            <th className="py-2 pr-3 font-medium">계좌</th>
            <th className="py-2 pr-3 font-medium text-right">수량</th>
            <th className="py-2 pr-3 font-medium text-right">평균매입가</th>
            <th className="py-2 pr-3 font-medium text-right">현재가</th>
            <th className="py-2 pr-3 font-medium text-right">평가손익</th>
            <th className="py-2 pr-3 font-medium text-right">수익률</th>
            <th className="py-2 pr-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => {
            const cost = h.quantity * h.avgBuyPrice;
            const value = h.quantity * h.currentPrice;
            const pnl = value - cost;
            const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
            const pnlColor = pnl >= 0 ? "text-[#006300] dark:text-[#0ca30c]" : "text-[#d03b3b]";
            return (
              <tr key={h._id} className="border-b border-neutral-100 dark:border-neutral-800/60">
                <td className="py-2 pr-3">
                  <div className="font-medium text-neutral-900 dark:text-white">{h.name}</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {h.market} · {h.assetType}
                  </div>
                </td>
                <td className="py-2 pr-3 text-neutral-600 dark:text-neutral-300">{h.account || "-"}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{formatNumber(h.quantity)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{formatNumber(h.avgBuyPrice)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{formatNumber(h.currentPrice)}</td>
                <td className={`py-2 pr-3 text-right tabular-nums ${pnlColor}`}>{formatNumber(pnl)}</td>
                <td className={`py-2 pr-3 text-right tabular-nums ${pnlColor}`}>{pnlPct.toFixed(1)}%</td>
                <td className="py-2 pr-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => onEdit(h)}
                    className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white mr-2"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => onDelete(h._id)}
                    className="text-xs text-[#d03b3b] hover:opacity-80"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

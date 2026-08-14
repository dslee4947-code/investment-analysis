export default function InsightCard({ holdings }) {
  if (holdings.length === 0) return null;

  const withValue = holdings.map((h) => ({ ...h, value: h.quantity * h.currentPrice }));
  const totalValue = withValue.reduce((s, h) => s + h.value, 0);
  if (totalValue <= 0) return null;

  const sorted = [...withValue].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const topShare = (top.value / totalValue) * 100;

  const typeCount = new Set(holdings.map((h) => h.assetType)).size;

  const cashValue = withValue.filter((h) => h.assetType === "현금").reduce((s, h) => s + h.value, 0);
  const cashShare = (cashValue / totalValue) * 100;

  const notes = [];
  if (topShare >= 40) {
    notes.push(`"${top.name}" 비중이 전체 자산의 ${topShare.toFixed(0)}%로 편중되어 있습니다.`);
  }
  if (typeCount <= 2) {
    notes.push(`자산군이 ${typeCount}종류로 분산도가 낮은 편입니다.`);
  }
  if (cashShare < 5) {
    notes.push(`현금 비중이 ${cashShare.toFixed(1)}%로 낮아 유동성이 적습니다.`);
  }
  if (notes.length === 0) {
    notes.push("특별히 편중된 부분 없이 자산이 고르게 분산되어 있습니다.");
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-neutral-900 shadow p-5">
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">포트폴리오 인사이트</h2>
      <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300 list-disc list-inside">
        {notes.map((n, i) => (
          <li key={i}>{n}</li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-neutral-400">
        참고용 정보 요약이며 투자 조언이 아닙니다.
      </p>
    </div>
  );
}

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const SERIES_COLORS = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#4a3aa7",
  "#e34948",
];
const OTHER_COLOR = "#898781";
const MAX_SLICES = 8;

function formatKRW(v) {
  return Math.round(v).toLocaleString("ko-KR") + "원";
}

export default function AllocationChart({ holdings, fxRate = 0, groupBy = (h) => h.ticker || h.name }) {
  const byGroup = {};
  holdings.forEach((h) => {
    const value = h.currency === "USD" ? h.quantity * h.currentPrice * fxRate : h.quantity * h.currentPrice;
    const key = groupBy(h) || "미지정";
    byGroup[key] = (byGroup[key] || 0) + value;
  });

  const entries = Object.entries(byGroup)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  let data = entries;
  if (entries.length > MAX_SLICES) {
    const top = entries.slice(0, MAX_SLICES - 1);
    const restSum = entries.slice(MAX_SLICES - 1).reduce((s, e) => s + e.value, 0);
    data = [...top, { name: "기타", value: restSum, isOther: true }];
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="text-sm text-neutral-500 dark:text-neutral-400 py-8 text-center">
        아직 등록된 종목이 없습니다.
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative shrink-0" style={{ width: 180, height: 180 }}>
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              stroke="#171717"
              strokeWidth={2}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.isOther ? OTHER_COLOR : SERIES_COLORS[i % SERIES_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatKRW(v)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs text-neutral-500 dark:text-neutral-400 leading-tight text-center">
            보유비중
            <br />
            (%)
          </span>
        </div>
      </div>
      <div className="w-full sm:flex-1 space-y-2">
        {data.map((d, i) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          return (
            <div key={d.name} className="flex items-center justify-between text-sm gap-2">
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: d.isOther ? OTHER_COLOR : SERIES_COLORS[i % SERIES_COLORS.length] }}
                />
                <span className="truncate text-neutral-700 dark:text-neutral-200">{d.name}</span>
              </span>
              <span className="text-neutral-900 dark:text-white font-medium tabular-nums shrink-0">
                {pct.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

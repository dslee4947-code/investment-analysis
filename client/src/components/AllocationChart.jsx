import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

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

function formatKRW(v) {
  return v.toLocaleString("ko-KR") + "원";
}

export default function AllocationChart({ holdings }) {
  const byType = {};
  holdings.forEach((h) => {
    const value = h.quantity * h.currentPrice;
    byType[h.assetType] = (byType[h.assetType] || 0) + value;
  });
  const data = Object.entries(byType)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return (
      <div className="text-sm text-neutral-500 dark:text-neutral-400 py-8 text-center">
        아직 등록된 종목이 없습니다.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={2}
          stroke="#fcfcfb"
          strokeWidth={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => formatKRW(v)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

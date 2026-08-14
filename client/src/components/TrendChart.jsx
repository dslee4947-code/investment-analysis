import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";

function formatKRW(v) {
  return v.toLocaleString("ko-KR") + "원";
}

export default function TrendChart({ snapshots }) {
  if (snapshots.length < 2) {
    return (
      <div className="text-sm text-neutral-500 dark:text-neutral-400 py-8 text-center">
        추이를 보려면 며칠 이상 데이터가 쌓여야 합니다.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={snapshots} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#e1e0d9" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#898781" }} axisLine={{ stroke: "#c3c2b7" }} />
        <YAxis
          tick={{ fontSize: 12, fill: "#898781" }}
          axisLine={{ stroke: "#c3c2b7" }}
          tickFormatter={(v) => `${Math.round(v / 10000)}만`}
        />
        <Tooltip formatter={(v) => formatKRW(v)} />
        <Legend />
        <Line type="monotone" dataKey="totalValue" name="평가금액" stroke="#2a78d6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="totalCost" name="매입원가" stroke="#eb6834" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

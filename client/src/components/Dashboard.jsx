import { useEffect, useState } from "react";
import api from "../api/client";
import AllocationChart from "./AllocationChart";
import TrendChart from "./TrendChart";
import HoldingsTable from "./HoldingsTable";
import HoldingForm from "./HoldingForm";
import PhotoUpload from "./PhotoUpload";
import InsightCard from "./InsightCard";

function formatKRW(v) {
  return Math.round(v).toLocaleString("ko-KR") + "원";
}

export default function Dashboard({ onLogout }) {
  const [holdings, setHoldings] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [hRes, sRes] = await Promise.all([api.get("/holdings"), api.get("/holdings/snapshots")]);
    setHoldings(hRes.data);
    setSnapshots(sRes.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(data) {
    if (editing) {
      await api.put(`/holdings/${editing._id}`, data);
    } else {
      await api.post("/holdings", data);
    }
    setEditing(null);
    await load();
  }

  async function handleDelete(id) {
    if (!confirm("이 종목을 삭제할까요?")) return;
    await api.delete(`/holdings/${id}`);
    await load();
  }

  async function handlePhotoSave(items) {
    await api.post("/holdings/bulk", { items });
    await load();
  }

  const totalValue = holdings.reduce((s, h) => s + h.quantity * h.currentPrice, 0);
  const totalCost = holdings.reduce((s, h) => s + h.quantity * h.avgBuyPrice, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const pnlColor = totalPnl >= 0 ? "text-[#006300] dark:text-[#0ca30c]" : "text-[#d03b3b]";

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-10 bg-[#f9f9f7]/90 dark:bg-[#0d0d0d]/90 backdrop-blur border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-base font-semibold text-neutral-900 dark:text-white">투자 전망 분석</h1>
        <button onClick={onLogout} className="text-sm text-neutral-500 dark:text-neutral-400">
          로그아웃
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {loading ? (
          <p className="text-sm text-neutral-500 text-center py-10">불러오는 중...</p>
        ) : (
          <>
            <div className="rounded-2xl bg-white dark:bg-neutral-900 shadow p-5">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">총 평가금액</div>
                  <div className="text-lg font-semibold text-neutral-900 dark:text-white tabular-nums">
                    {formatKRW(totalValue)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">총 매입원가</div>
                  <div className="text-lg font-semibold text-neutral-900 dark:text-white tabular-nums">
                    {formatKRW(totalCost)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">평가손익</div>
                  <div className={`text-lg font-semibold tabular-nums ${pnlColor}`}>
                    {formatKRW(totalPnl)} ({totalPnlPct.toFixed(1)}%)
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white dark:bg-neutral-900 shadow p-5">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">자산 배분</h2>
              <AllocationChart holdings={holdings} />
            </div>

            <div className="rounded-2xl bg-white dark:bg-neutral-900 shadow p-5">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">자산 추이</h2>
              <TrendChart snapshots={snapshots} />
            </div>

            <InsightCard holdings={holdings} />

            <div className="rounded-2xl bg-white dark:bg-neutral-900 shadow p-5">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">보유 종목</h2>
              <HoldingsTable holdings={holdings} onEdit={setEditing} onDelete={handleDelete} />
            </div>

            <div className="rounded-2xl bg-white dark:bg-neutral-900 shadow p-5">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                {editing ? "종목 수정" : "종목 직접 추가"}
              </h2>
              <HoldingForm initial={editing} onSubmit={handleSubmit} onCancel={() => setEditing(null)} />
            </div>

            <div className="rounded-2xl bg-white dark:bg-neutral-900 shadow p-5">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">사진으로 추가</h2>
              <PhotoUpload onSave={handlePhotoSave} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

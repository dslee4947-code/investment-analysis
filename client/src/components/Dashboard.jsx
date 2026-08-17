import { useEffect, useRef, useState } from "react";
import api from "../api/client";
import AllocationChart from "./AllocationChart";
import TrendChart from "./TrendChart";
import HoldingsTable from "./HoldingsTable";
import HoldingForm from "./HoldingForm";
import PhotoUpload from "./PhotoUpload";
import InsightCard from "./InsightCard";
import FearGreedCard from "./FearGreedCard";
import NetWorthCard from "./NetWorthCard";
import { ACCOUNT_PRESETS } from "../constants";

function formatKRW(v) {
  return Math.round(v).toLocaleString("ko-KR") + "원";
}

export default function Dashboard({ onLogout }) {
  const [holdings, setHoldings] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [fxRate, setFxRate] = useState(null);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accountFilter, setAccountFilter] = useState("전체");
  const [stockMetrics, setStockMetrics] = useState({});
  const [fearGreed, setFearGreed] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const editFormRef = useRef(null);

  async function load() {
    setLoading(true);
    const [hRes, sRes, fxRes, dRes] = await Promise.all([
      api.get("/holdings"),
      api.get("/holdings/snapshots"),
      api.get("/holdings/fx/usd-krw"),
      api.get("/deposits"),
    ]);
    setHoldings(hRes.data);
    setSnapshots(sRes.data);
    setFxRate(fxRes.data.rate);
    setDeposits(dRes.data);
    setLoading(false);
  }

  async function loadDeposits() {
    const res = await api.get("/deposits");
    setDeposits(res.data);
  }

  useEffect(() => {
    load();
    api
      .get("/market/fear-greed")
      .then((res) => setFearGreed(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const tickers = holdings
      .filter((h) => (h.assetType === "주식" || h.assetType === "ETF") && h.ticker)
      .map((h) => h.ticker);
    if (tickers.length === 0) return;
    api
      .get(`/market/stock-metrics?tickers=${encodeURIComponent([...new Set(tickers)].join(","))}`)
      .then((res) => setStockMetrics(res.data))
      .catch(() => {});
  }, [holdings]);

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

  async function handleAccountChange(id, account) {
    await api.put(`/holdings/${id}`, { account });
    await load();
  }

  function handleEditClick(h) {
    setEditing(h);
    editFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const accountTabs = [
    "전체",
    ...ACCOUNT_PRESETS,
    ...new Set(holdings.map((h) => h.account).filter((a) => a && !ACCOUNT_PRESETS.includes(a))),
  ];
  const filteredHoldings =
    accountFilter === "전체" ? holdings : holdings.filter((h) => h.account === accountFilter);

  const rate = fxRate || 0;
  const toKRW = (h, price) => (h.currency === "USD" ? h.quantity * price * rate : h.quantity * price);
  const totalAssets = holdings.reduce((s, h) => s + toKRW(h, h.currentPrice), 0);
  const totalCostBasis = holdings.reduce((s, h) => s + toKRW(h, h.avgBuyPrice), 0);

  const accountStats = accountTabs
    .filter((a) => a !== "전체")
    .map((name) => {
      const hs = holdings.filter((h) => h.account === name);
      const value = hs.reduce((s, h) => s + toKRW(h, h.currentPrice), 0);
      const cost = hs.reduce((s, h) => s + toKRW(h, h.avgBuyPrice), 0);
      const pnl = value - cost;
      const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
      return { name, holdings: hs, value, cost, pnl, pnlPct };
    })
    .filter((a) => a.holdings.length > 0);

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
            <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
              {accountTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setAccountFilter(tab)}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium border ${
                    accountFilter === tab
                      ? "bg-[#2a78d6] text-white border-[#2a78d6]"
                      : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <NetWorthCard
              totalAssets={totalAssets}
              totalCostBasis={totalCostBasis}
              deposits={deposits}
              onReload={loadDeposits}
            />

            <div className="rounded-2xl bg-white dark:bg-neutral-900 shadow p-5 space-y-4">
              {rate > 0 && (
                <p className="text-center text-xs text-neutral-400">
                  적용 환율 1 USD ≈ {Math.round(rate).toLocaleString("ko-KR")}원 (해외 종목 원화 환산 기준)
                </p>
              )}
              {accountStats.map((a, i) => {
                const color = a.pnl >= 0 ? "text-[#006300] dark:text-[#0ca30c]" : "text-[#d03b3b]";
                return (
                  <div key={a.name} className={i > 0 ? "pt-4 border-t border-neutral-100 dark:border-neutral-800" : ""}>
                    <div className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">{a.name}</div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">총 평가금액</div>
                        <div className="text-base font-semibold text-neutral-900 dark:text-white tabular-nums">
                          {formatKRW(a.value)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">총 매입원가</div>
                        <div className="text-base font-semibold text-neutral-900 dark:text-white tabular-nums">
                          {formatKRW(a.cost)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">평가손익</div>
                        <div className={`text-base font-semibold tabular-nums ${color}`}>
                          {formatKRW(a.pnl)} ({a.pnlPct.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {accountStats.map((a) => (
              <div key={a.name} className="rounded-2xl bg-white dark:bg-neutral-900 shadow p-5">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                  {a.name} 자산별 배분
                </h2>
                <AllocationChart holdings={a.holdings} fxRate={rate} />
                {a.name === "비트코인" && (
                  <div className="mt-5 pt-5 border-t border-neutral-100 dark:border-neutral-800">
                    <FearGreedCard bare />
                  </div>
                )}
              </div>
            ))}

            <div className="rounded-2xl bg-white dark:bg-neutral-900 shadow p-5">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">자산 추이</h2>
              {accountFilter !== "전체" && (
                <p className="text-xs text-neutral-400 mb-2">추이는 전체 계좌 합산 기준으로 표시됩니다.</p>
              )}
              <TrendChart snapshots={snapshots} />
            </div>

            <InsightCard holdings={filteredHoldings} fxRate={rate} />

            <div className="rounded-2xl bg-white dark:bg-neutral-900 shadow p-5">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                보유 종목 {accountFilter !== "전체" && `· ${accountFilter}`}
              </h2>
              <HoldingsTable
                holdings={filteredHoldings}
                onEdit={handleEditClick}
                onDelete={handleDelete}
                onAccountChange={handleAccountChange}
                fxRate={rate}
                stockMetrics={stockMetrics}
                fearGreed={fearGreed}
              />
            </div>

            <div ref={editFormRef} className="rounded-2xl bg-white dark:bg-neutral-900 shadow p-5">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                {editing ? `종목 수정 · ${editing.name}` : "종목 직접 추가"}
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

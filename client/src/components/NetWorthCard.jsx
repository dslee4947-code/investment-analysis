import { useState } from "react";
import api from "../api/client";

function formatKRW(v) {
  return Math.round(v).toLocaleString("ko-KR") + "원";
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function NetWorthCard({ totalAssets, totalCostBasis, deposits, onReload }) {
  const [showList, setShowList] = useState(false);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  const totalPrincipal = deposits.reduce((s, d) => s + d.amount, 0);
  const hasStarted = deposits.length > 0;
  const gain = totalAssets - totalPrincipal;
  const gainPct = totalPrincipal > 0 ? (gain / totalPrincipal) * 100 : 0;
  const gainColor = gain >= 0 ? "text-[#006300] dark:text-[#0ca30c]" : "text-[#d03b3b]";

  async function handleInitialize() {
    if (saving) return;
    setSaving(true);
    try {
      await api.post("/deposits", {
        date: todayStr(),
        amount: Math.round(totalCostBasis),
        memo: "초기 원금 설정",
      });
      await onReload();
    } finally {
      setSaving(false);
    }
  }

  async function handleAddDeposit(e) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || saving) return;
    setSaving(true);
    try {
      await api.post("/deposits", { date: todayStr(), amount: value, memo });
      setAmount("");
      setMemo("");
      await onReload();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("이 입금 내역을 삭제할까요?")) return;
    await api.delete(`/deposits/${id}`);
    await onReload();
  }

  if (!hasStarted) {
    return (
      <div className="rounded-2xl bg-white dark:bg-neutral-900 shadow p-5">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">내 자산 증가 현황</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
          지금까지 실제로 투자한 원금(현재 보유 종목의 매입원가 합계 {formatKRW(totalCostBasis)})을 초기
          원금으로 설정하면, 이후 입금한 금액과 비교해서 실제로 자산이 얼마나 늘었는지 계산해드려요.
        </p>
        <button
          onClick={handleInitialize}
          disabled={saving}
          className="rounded-lg bg-[#2a78d6] text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {saving ? "설정 중..." : "오늘 자산을 초기 원금으로 설정"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-neutral-900 shadow p-5">
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">내 자산 증가 현황</h2>

      <div className="grid grid-cols-3 gap-3 text-center mb-4">
        <div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">총 투입원금</div>
          <div className="text-base font-semibold text-neutral-900 dark:text-white tabular-nums">
            {formatKRW(totalPrincipal)}
          </div>
        </div>
        <div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">현재 총자산</div>
          <div className="text-base font-semibold text-neutral-900 dark:text-white tabular-nums">
            {formatKRW(totalAssets)}
          </div>
        </div>
        <div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">순증감</div>
          <div className={`text-base font-semibold tabular-nums ${gainColor}`}>
            {formatKRW(gain)} ({gainPct.toFixed(1)}%)
          </div>
        </div>
      </div>

      <form onSubmit={handleAddDeposit} className="flex flex-wrap gap-2 mb-3">
        <input
          type="number"
          placeholder="입금액 (원)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 min-w-[120px] rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm text-neutral-900 dark:text-white"
        />
        <input
          type="text"
          placeholder="메모 (예: 8월 월급)"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="flex-1 min-w-[120px] rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm text-neutral-900 dark:text-white"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#2a78d6] text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          입금 추가
        </button>
      </form>

      <button
        onClick={() => setShowList((v) => !v)}
        className="text-xs text-neutral-500 dark:text-neutral-400 hover:underline"
      >
        입금 내역 {deposits.length}건 {showList ? "숨기기" : "보기"}
      </button>

      {showList && (
        <ul className="mt-2 space-y-1 text-sm">
          {[...deposits].reverse().map((d) => (
            <li
              key={d._id}
              className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/60 py-1.5"
            >
              <span className="text-neutral-500 dark:text-neutral-400">
                {d.date} {d.memo && `· ${d.memo}`}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-neutral-900 dark:text-white tabular-nums">{formatKRW(d.amount)}</span>
                <button
                  onClick={() => handleDelete(d._id)}
                  className="text-xs text-[#d03b3b] hover:opacity-80"
                >
                  삭제
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-neutral-400">
        총 투입원금 = 초기 자산 + 이후 입금 누적액. 실제로 돈을 얼마나 불렸는지 보여주는 지표입니다.
      </p>
    </div>
  );
}

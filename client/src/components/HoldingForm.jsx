import { useState, useEffect } from "react";

const EMPTY = {
  name: "",
  ticker: "",
  market: "국내",
  assetType: "주식",
  quantity: "",
  avgBuyPrice: "",
  currentPrice: "",
  currency: "KRW",
  account: "",
  memo: "",
};

export default function HoldingForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (initial) {
      setForm({ ...EMPTY, ...initial });
    } else {
      setForm(EMPTY);
    }
  }, [initial]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      quantity: Number(form.quantity) || 0,
      avgBuyPrice: Number(form.avgBuyPrice) || 0,
      currentPrice: Number(form.currentPrice) || 0,
    });
    if (!initial) setForm(EMPTY);
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm text-neutral-900 dark:text-white";
  const selectClass = inputClass;

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <input
        className={`${inputClass} col-span-2 sm:col-span-1`}
        placeholder="종목명 *"
        value={form.name}
        onChange={(e) => update("name", e.target.value)}
        required
      />
      <input
        className={inputClass}
        placeholder="티커"
        value={form.ticker}
        onChange={(e) => update("ticker", e.target.value)}
      />
      <select className={selectClass} value={form.market} onChange={(e) => update("market", e.target.value)}>
        <option>국내</option>
        <option>미국</option>
        <option>암호화폐</option>
        <option>기타</option>
      </select>
      <select className={selectClass} value={form.assetType} onChange={(e) => update("assetType", e.target.value)}>
        <option>주식</option>
        <option>ETF</option>
        <option>현금</option>
        <option>채권</option>
        <option>암호화폐</option>
        <option>기타</option>
      </select>
      <select className={selectClass} value={form.currency} onChange={(e) => update("currency", e.target.value)}>
        <option>KRW</option>
        <option>USD</option>
      </select>
      <input
        className={inputClass}
        placeholder="계좌/증권사"
        value={form.account}
        onChange={(e) => update("account", e.target.value)}
      />
      <input
        className={inputClass}
        type="number"
        step="any"
        placeholder="수량"
        value={form.quantity}
        onChange={(e) => update("quantity", e.target.value)}
      />
      <input
        className={inputClass}
        type="number"
        step="any"
        placeholder="평균매입가"
        value={form.avgBuyPrice}
        onChange={(e) => update("avgBuyPrice", e.target.value)}
      />
      <input
        className={inputClass}
        type="number"
        step="any"
        placeholder="현재가"
        value={form.currentPrice}
        onChange={(e) => update("currentPrice", e.target.value)}
      />
      <input
        className={`${inputClass} col-span-2 sm:col-span-3`}
        placeholder="메모"
        value={form.memo}
        onChange={(e) => update("memo", e.target.value)}
      />
      <div className="col-span-2 sm:col-span-3 flex gap-2">
        <button type="submit" className="rounded-lg bg-[#2a78d6] text-white px-4 py-2 text-sm font-medium">
          {initial ? "수정 저장" : "종목 추가"}
        </button>
        {initial && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}

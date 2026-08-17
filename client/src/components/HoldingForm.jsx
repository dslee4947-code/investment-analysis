import { useState, useEffect } from "react";
import { ACCOUNT_PRESETS } from "../constants";
import Select from "./Select";

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
      <Select
        className="w-full"
        value={form.market}
        onChange={(v) => update("market", v)}
        options={["국내", "미국", "암호화폐", "기타"]}
        buttonClassName={inputClass}
      />
      <Select
        className="w-full"
        value={form.assetType}
        onChange={(v) => update("assetType", v)}
        options={["주식", "ETF", "현금", "채권", "암호화폐", "기타"]}
        buttonClassName={inputClass}
      />
      <Select
        className="w-full"
        value={form.currency}
        onChange={(v) => update("currency", v)}
        options={["KRW", "USD"]}
        buttonClassName={inputClass}
      />
      <input
        className={inputClass}
        placeholder="계좌/증권사"
        list="account-presets"
        value={form.account}
        onChange={(e) => update("account", e.target.value)}
      />
      <datalist id="account-presets">
        {ACCOUNT_PRESETS.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>
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

import { useState } from "react";
import api from "../api/client";
import { ACCOUNT_PRESETS } from "../constants";
import Select from "./Select";

export default function PhotoUpload({ onSave }) {
  const [file, setFile] = useState(null);
  const [account, setAccount] = useState(ACCOUNT_PRESETS[0]);
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/holdings/parse-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setItems(res.data.items.map((it) => ({ ...it, account, include: true })));
    } catch (err) {
      setError(err.response?.data?.message || "이미지 분석에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function updateItem(i, field, value) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  }

  async function handleSaveAll() {
    const toSave = items.filter((it) => it.include).map(({ include, ...rest }) => rest);
    if (toSave.length === 0) return;
    await onSave(toSave);
    setItems(null);
    setFile(null);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        증권사/거래소 앱 스크린샷을 업로드하면 AI가 종목/수량/가격을 읽어 아래에서 확인·수정 후 저장할 수 있습니다.
      </p>
      <div className="flex flex-wrap gap-2 items-center">
        <Select
          value={account}
          onChange={setAccount}
          options={ACCOUNT_PRESETS}
          buttonClassName="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm text-neutral-900 dark:text-white"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-sm text-neutral-700 dark:text-neutral-200"
        />
        <button
          onClick={handleAnalyze}
          disabled={!file || loading}
          className="rounded-lg bg-[#1baf7a] text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {loading ? "분석 중..." : "사진 분석"}
        </button>
      </div>
      {error && <p className="text-sm text-[#d03b3b]">{error}</p>}

      {items && items.length > 0 && (
        <div className="space-y-2">
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left text-neutral-500 dark:text-neutral-400">
                  <th className="py-1 pr-2"></th>
                  <th className="py-1 pr-2 font-medium">종목명</th>
                  <th className="py-1 pr-2 font-medium text-right">수량</th>
                  <th className="py-1 pr-2 font-medium text-right">매입가</th>
                  <th className="py-1 pr-2 font-medium text-right">현재가</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i}>
                    <td className="py-1 pr-2">
                      <input
                        type="checkbox"
                        checked={it.include}
                        onChange={(e) => updateItem(i, "include", e.target.checked)}
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        className="w-full bg-transparent border-b border-neutral-300 dark:border-neutral-700"
                        value={it.name}
                        onChange={(e) => updateItem(i, "name", e.target.value)}
                      />
                    </td>
                    <td className="py-1 pr-2 text-right">
                      <input
                        type="number"
                        className="w-20 bg-transparent border-b border-neutral-300 dark:border-neutral-700 text-right"
                        value={it.quantity}
                        onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                      />
                    </td>
                    <td className="py-1 pr-2 text-right">
                      <input
                        type="number"
                        className="w-24 bg-transparent border-b border-neutral-300 dark:border-neutral-700 text-right"
                        value={it.avgBuyPrice}
                        onChange={(e) => updateItem(i, "avgBuyPrice", Number(e.target.value))}
                      />
                    </td>
                    <td className="py-1 pr-2 text-right">
                      <input
                        type="number"
                        className="w-24 bg-transparent border-b border-neutral-300 dark:border-neutral-700 text-right"
                        value={it.currentPrice}
                        onChange={(e) => updateItem(i, "currentPrice", Number(e.target.value))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleSaveAll}
            className="rounded-lg bg-[#2a78d6] text-white px-4 py-2 text-sm font-medium"
          >
            선택 항목 저장
          </button>
        </div>
      )}
    </div>
  );
}

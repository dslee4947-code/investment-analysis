import { useEffect, useRef, useState } from "react";

export default function Select({ value, onChange, options, className = "", buttonClassName = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const normalized = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const current = normalized.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center justify-between gap-1 w-full ${buttonClassName}`}
      >
        <span className="truncate">{current ? current.label : ""}</span>
        <span className="opacity-60 shrink-0">▾</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 min-w-full max-h-56 overflow-auto rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg">
          {normalized.map((o) => (
            <div
              key={o.value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`px-3 py-1.5 text-sm cursor-pointer whitespace-nowrap hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
                o.value === value
                  ? "text-[#2a78d6] font-medium"
                  : "text-neutral-700 dark:text-neutral-200"
              }`}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

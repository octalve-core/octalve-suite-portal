"use client";

import { useState } from "react";

export function ClientPaymentCopyRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[10px] font-medium uppercase tracking-[0.09em] text-slate-400">
        {label}
      </span>

      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:text-[#0064E0] sm:w-auto"
        title={`Copy ${label}`}
      >
        <strong className="break-all">{value}</strong>
        <small className={copied ? "text-emerald-600" : "text-slate-400"}>
          {copied ? "Copied" : "Copy"}
        </small>
      </button>
    </div>
  );
}

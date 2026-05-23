"use client";

import { X } from "lucide-react";
import type React from "react";

export function ClientModalShell({
  title,
  children,
  onClose,
  maxWidth = "max-w-xl",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/70 p-4"
      onMouseDown={onClose}
    >
      <section
        className={`max-h-[88vh] w-full overflow-auto rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_30px_90px_rgba(0,0,0,0.28)] sm:p-6 ${maxWidth}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {children}
      </section>
    </div>
  );
}

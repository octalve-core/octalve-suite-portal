"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { ApprovalRow } from "./client-approvals-utils";
import { ClientModalShell } from "../shared/ClientModalShell";

export function ClientRequestChangeModal({
  row,
  onClose,
  onSubmit,
}: {
  row: ApprovalRow;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!text.trim()) {
      setError("Please explain what should be changed before submitting.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await onSubmit(text.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request changes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ClientModalShell
      title={`Request Changes: ${row.phase.title}`}
      onClose={onClose}
      maxWidth="max-w-xl"
    >
      <div className="grid gap-4">
        <p className="m-0 text-sm font-medium leading-6 text-slate-500">
          Tell the delivery team what should be corrected before you approve this phase.
        </p>

        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={loading}
          placeholder="Explain the changes you want..."
          className="min-h-36 w-full resize-y rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
        />

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </button>
        </div>
      </div>
    </ClientModalShell>
  );
}

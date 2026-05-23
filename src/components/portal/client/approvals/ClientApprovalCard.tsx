import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareText,
} from "lucide-react";

import type { ApprovalRow } from "./client-approvals-utils";
import {
  approvalIconTone,
  approvalStatusLabel,
  approvalTone,
} from "./client-approvals-utils";

export function ClientApprovalCard({
  row,
  loadingAction,
  onApprove,
  onRequestChanges,
}: {
  row: ApprovalRow;
  loadingAction: string;
  onApprove: (row: ApprovalRow) => void;
  onRequestChanges: (row: ApprovalRow) => void;
}) {
  const { project, phase } = row;
  const canReview = phase.status === "AWAITING_APPROVAL";

  return (
    <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <span
            className={[
              "grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1",
              approvalIconTone(phase.status),
            ].join(" ")}
          >
            {phase.status === "APPROVED" ? (
              <CheckCircle2 size={20} />
            ) : phase.status === "CHANGES_REQUESTED" ? (
              <FileText size={20} />
            ) : (
              <Clock3 size={20} />
            )}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={[
                  "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                  approvalTone(phase.status),
                ].join(" ")}
              >
                {approvalStatusLabel(phase.status)}
              </span>

              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                {project.projectCode}
              </span>
            </div>

            <h3 className="mt-4 text-xl font-semibold tracking-[-0.04em] text-slate-950">
              {phase.title}
            </h3>

            <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-slate-500">
              {project.title} - {phase.description || "Delivery phase awaiting review activity."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                <FileText size={13} />
                {phase.deliverables.length} deliverables
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                <MessageSquareText size={13} />
                {phase.messages.length} messages
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          {canReview ? (
            <>
              <button
                type="button"
                onClick={() => onApprove(row)}
                disabled={Boolean(loadingAction)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-4 text-sm font-semibold text-white transition hover:bg-[#0052B8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingAction === `approve-${phase.id}` ? "Approving..." : "Approve"}
              </button>

              <button
                type="button"
                onClick={() => onRequestChanges(row)}
                disabled={Boolean(loadingAction)}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Request Changes
              </button>
            </>
          ) : null}

          <Link
            href={`/client/phases/${phase.id}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-[#0064E0]"
          >
            View Phase
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}

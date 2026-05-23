import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareText,
  MoreVertical,
  XCircle,
} from "lucide-react";

import type { ApprovalRow } from "./client-approvals-utils";
import {
  approvalActionLabel,
  approvalIconTone,
  approvalStatusLabel,
  approvalTone,
  formatApprovalDate,
  formatApprovalTime,
  getApprovalDate,
} from "./client-approvals-utils";

function iconForStatus(status: ApprovalRow["phase"]["status"]) {
  if (status === "APPROVED") return <CheckCircle2 size={18} />;
  if (status === "CHANGES_REQUESTED") return <XCircle size={18} />;
  if (status === "AWAITING_APPROVAL") return <Clock3 size={18} />;

  return <FileText size={18} />;
}

export function ClientApprovalCard({ row }: { row: ApprovalRow }) {
  const { project, phase } = row;
  const dateValue = getApprovalDate(row);

  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-3">
        <span
          className={[
            "grid h-11 w-11 shrink-0 place-items-center rounded-full ring-1",
            approvalIconTone(phase.status),
          ].join(" ")}
        >
          {iconForStatus(phase.status)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold tracking-[-0.035em] text-slate-950">
                {phase.title}
              </h3>
              <p className="mt-1 truncate text-sm font-medium text-slate-500">
                {project.projectCode}
              </p>
            </div>

            <button
              type="button"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              aria-label="More approval options"
            >
              <MoreVertical size={17} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Project
              </span>
              <strong className="mt-1 block text-sm text-slate-950">
                {project.title}
              </strong>
            </div>

            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Date
              </span>
              <strong className="mt-1 block text-sm text-slate-950">
                {formatApprovalDate(dateValue)}
              </strong>
            </div>

            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Deliverables
              </span>
              <strong className="mt-1 inline-flex items-center gap-1 text-sm text-slate-950">
                <FileText size={14} />
                {phase.deliverables.length}
              </strong>
            </div>

            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Messages
              </span>
              <strong className="mt-1 inline-flex items-center gap-1 text-sm text-slate-950">
                <MessageSquareText size={14} />
                {phase.messages.length}
              </strong>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4">
            <span
              className={[
                "inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold",
                approvalTone(phase.status),
              ].join(" ")}
            >
              {approvalStatusLabel(phase.status)}
            </span>

            <Link
              href={`/client/phases/${phase.id}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-4 text-sm font-semibold text-[#0064E0] transition hover:bg-blue-50"
            >
              {approvalActionLabel(phase.status)}
              <ArrowRight size={16} />
            </Link>

            <span className="text-xs font-semibold text-slate-400">
              {formatApprovalTime(dateValue)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

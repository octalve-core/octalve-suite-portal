import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareText,
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

            <Link
              href={`/client/phases/${phase.id}`}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-blue-50 hover:text-[#0064E0]"
              aria-label={`Open approval details for ${phase.title}`}
            >
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Project
              </span>
              <strong className="mt-1 block truncate text-sm text-slate-950">
                {project.title}
              </strong>
            </div>

            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Updated
              </span>
              <strong className="mt-1 block text-sm text-slate-950">
                {formatApprovalDate(dateValue)}
              </strong>
              <span className="block text-xs font-semibold text-slate-400">
                {formatApprovalTime(dateValue)}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Deliverables
              </span>
              <strong className="mt-1 block text-sm text-slate-950">
                {phase.deliverables.length}
              </strong>
            </div>

            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Messages
              </span>
              <strong className="mt-1 inline-flex items-center gap-1 text-sm text-slate-950">
                <MessageSquareText size={14} />
                {phase.messages.length}
              </strong>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span
              className={[
                "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                approvalTone(phase.status),
              ].join(" ")}
            >
              {approvalStatusLabel(phase.status)}
            </span>

            <Link
              href={`/client/phases/${phase.id}`}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0064E0] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(0,100,224,0.16)] transition hover:bg-[#0052B8]"
            >
              {approvalActionLabel(phase.status)}
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Layers3,
  LockKeyhole,
  MessageSquareText,
} from "lucide-react";

import type { ClientPhaseRow } from "./client-phases-utils";
import {
  formatPhaseDate,
  phaseIconTone,
  phaseProgress,
} from "./client-phases-utils";
import { ClientPhaseStatusChip } from "./ClientPhaseStatusChip";

function iconForStatus(status: ClientPhaseRow["phase"]["status"]) {
  if (status === "APPROVED") return <CheckCircle2 size={19} />;
  if (status === "AWAITING_APPROVAL") return <Clock3 size={19} />;
  if (status === "LOCKED") return <LockKeyhole size={19} />;
  return <Layers3 size={19} />;
}

export function ClientPhaseCard({ row }: { row: ClientPhaseRow }) {
  const { project, phase } = row;
  const progress = phaseProgress(phase);

  return (
    <Link
      href={`/client/phases/${phase.id}`}
      className="group block rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_22px_50px_rgba(0,100,224,0.10)]"
    >
      <div className="flex min-h-[275px] flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-4">
            <span
              className={[
                "grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1",
                phaseIconTone(phase.status),
              ].join(" ")}
            >
              {iconForStatus(phase.status)}
            </span>

            <ClientPhaseStatusChip status={phase.status} />
          </div>

          <h3 className="mt-6 text-xl font-semibold tracking-[-0.04em] text-slate-950">
            {phase.title}
          </h3>

          <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-slate-500">
            {phase.status === "LOCKED"
              ? "Complete previous phase first to unlock."
              : phase.description || "Project delivery phase."}
          </p>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <strong className="block truncate text-sm text-slate-950">
              {project.title}
            </strong>
            <span className="mt-1 block truncate text-xs font-semibold text-slate-500">
              {project.projectCode} · {project.businessName}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <FileText size={16} className="text-[#0064E0]" />
              <strong className="mt-1 block text-sm text-slate-950">
                {phase.deliverables.length}
              </strong>
              <span className="text-xs font-semibold text-slate-400">
                Files
              </span>
            </div>
            <div>
              <MessageSquareText size={16} className="text-[#0064E0]" />
              <strong className="mt-1 block text-sm text-slate-950">
                {phase.messages.length}
              </strong>
              <span className="text-xs font-semibold text-slate-400">
                Chats
              </span>
            </div>
            <div>
              <Clock3 size={16} className="text-[#0064E0]" />
              <strong className="mt-1 block truncate text-sm text-slate-950">
                {formatPhaseDate(phase.approvalRequestedAt)}
              </strong>
              <span className="text-xs font-semibold text-slate-400">
                Review
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-500">Progress</span>
            <strong className="text-slate-950">{progress}%</strong>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <span
              className="block h-full rounded-full bg-[#0064E0]"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>

          <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#0064E0]">
            Open phase
            <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

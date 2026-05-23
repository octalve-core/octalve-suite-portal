import Link from "next/link";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
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
import { ClientApprovalCard } from "./ClientApprovalCard";

function iconForStatus(status: ApprovalRow["phase"]["status"]) {
  if (status === "APPROVED") return <CheckCircle2 size={17} />;
  if (status === "CHANGES_REQUESTED") return <XCircle size={17} />;
  if (status === "AWAITING_APPROVAL") return <Clock3 size={17} />;

  return <FileText size={17} />;
}

export function ClientApprovalList({ rows }: { rows: ApprovalRow[] }) {
  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
          <CheckCircle2 size={24} />
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-slate-950">
          No approvals match this filter
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Switch project or status filter to review other phase approval records.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1080px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              <th className="px-5 py-4">Phase / Approval Item</th>
              <th className="px-5 py-4">Project</th>
              <th className="px-5 py-4">Submitted / Updated Date</th>
              <th className="px-5 py-4">Deliverables</th>
              <th className="px-5 py-4">Messages</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-center">Action</th>
              <th className="w-10 px-2 py-4" />
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const { project, phase } = row;
              const dateValue = getApprovalDate(row);

              return (
                <tr
                  key={`${project.id}-${phase.id}`}
                  className="border-b border-slate-200 bg-white text-sm transition last:border-b-0 hover:bg-slate-50/70"
                >
                  <td className="px-5 py-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={[
                          "grid h-11 w-11 shrink-0 place-items-center rounded-full ring-1",
                          approvalIconTone(phase.status),
                        ].join(" ")}
                      >
                        {iconForStatus(phase.status)}
                      </span>

                      <div className="min-w-0">
                        <strong className="block max-w-[240px] truncate text-sm font-semibold text-slate-950">
                          {phase.title}
                        </strong>
                        <span className="mt-1 block text-xs font-semibold text-slate-500">
                          {project.projectCode}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-5">
                    <strong className="block max-w-[220px] truncate text-sm font-semibold text-slate-950">
                      {project.title}
                    </strong>
                    <span className="mt-1 block max-w-[260px] truncate text-xs font-semibold text-slate-500">
                      {phase.description || project.businessName}
                    </span>
                  </td>

                  <td className="px-5 py-5">
                    <strong className="block text-sm font-semibold text-slate-950">
                      {formatApprovalDate(dateValue)}
                    </strong>
                    <span className="mt-1 block text-xs font-semibold text-slate-500">
                      {formatApprovalTime(dateValue)}
                    </span>
                  </td>

                  <td className="px-5 py-5">
                    <strong className="block text-sm text-slate-950">
                      {phase.deliverables.length}
                    </strong>
                    <span className="mt-1 block text-xs font-semibold text-slate-500">
                      deliverables
                    </span>
                  </td>

                  <td className="px-5 py-5">
                    <strong className="block text-sm text-slate-950">
                      {phase.messages.length}
                    </strong>
                    <span className="mt-1 block text-xs font-semibold text-slate-500">
                      {phase.messages.length === 1 ? "message" : "messages"}
                    </span>
                  </td>

                  <td className="px-5 py-5">
                    <span
                      className={[
                        "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                        approvalTone(phase.status),
                      ].join(" ")}
                    >
                      {approvalStatusLabel(phase.status)}
                    </span>
                  </td>

                  <td className="px-5 py-5 text-center">
                    <Link
                      href={`/client/phases/${phase.id}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-blue-200 bg-white px-4 text-sm font-semibold text-[#0064E0] transition hover:bg-blue-50"
                    >
                      {approvalActionLabel(phase.status)}
                    </Link>
                  </td>

                  <td className="px-2 py-5">
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="More approval options"
                    >
                      <MoreVertical size={17} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing 1 to {rows.length} of {rows.length} approvals
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-300"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="grid h-9 min-w-9 place-items-center rounded-xl bg-[#0064E0] px-3 text-white">
              1
            </span>

            <button
              type="button"
              disabled
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-300"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>

            <select
              value="10"
              disabled
              className="ml-3 h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-500"
            >
              <option value="10">10 / page</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4 lg:hidden">
        {rows.map((row) => (
          <ClientApprovalCard key={`${row.project.id}-${row.phase.id}`} row={row} />
        ))}
      </div>
    </>
  );
}
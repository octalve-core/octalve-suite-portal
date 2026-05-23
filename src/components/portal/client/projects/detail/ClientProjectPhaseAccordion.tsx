import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  MoreVertical,
} from "lucide-react";

import type { Project, ProjectPhase } from "@/lib/types";
import {
  DELIVERABLE_STATUS_LABELS,
  PHASE_STATUS_LABELS,
  cn,
  deliverableLinkLabel,
  deliverableStatusTone,
  formatDetailDate,
  phaseAccent,
  phaseNumberTone,
  phaseProgress,
  phaseStatusTone,
  visibleDeliverablesForClient,
} from "./client-project-detail-utils";

function PhaseStatusChip({ status }: { status: ProjectPhase["status"] }) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
        phaseStatusTone(status),
      ].join(" ")}
    >
      {PHASE_STATUS_LABELS[status]}
    </span>
  );
}

function DeliverableStatusChip({
  status,
}: {
  status: ProjectPhase["deliverables"][number]["status"];
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
        deliverableStatusTone(status),
      ].join(" ")}
    >
      {DELIVERABLE_STATUS_LABELS[status]}
    </span>
  );
}

function DeliverablesTable({
  phase,
  project,
}: {
  phase: ProjectPhase;
  project: Project;
}) {
  const deliverables = visibleDeliverablesForClient(phase);

  if (!deliverables.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
          <FileText size={22} />
        </div>
        <h3 className="mt-4 text-base font-semibold tracking-[-0.03em] text-slate-950">
          No client-visible deliverables yet
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Deliverables will appear here when the delivery team makes them visible for this phase.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Deliverables ({deliverables.length})
        </span>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[780px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              <th className="px-4 py-3">Deliverable</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assigned To</th>
              <th className="px-4 py-3">Last Updated</th>
              <th className="w-10 px-2 py-3" />
            </tr>
          </thead>

          <tbody>
            {deliverables.map((deliverable) => (
              <tr
                key={deliverable.id}
                className="border-b border-slate-100 text-sm last:border-b-0"
              >
                <td className="px-4 py-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-200">
                      <FileText size={16} />
                    </span>

                    <div className="min-w-0">
                      <strong className="block truncate text-sm text-slate-950">
                        {deliverable.name}
                      </strong>
                      {deliverable.description ? (
                        <span className="mt-1 block line-clamp-1 text-xs font-medium text-slate-500">
                          {deliverable.description}
                        </span>
                      ) : null}

                      {deliverable.link ? (
                        <a
                          href={deliverable.link}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#0064E0] hover:underline"
                        >
                          {deliverableLinkLabel(deliverable)}
                          <ExternalLink size={12} />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <DeliverableStatusChip status={deliverable.status} />
                </td>

                <td className="px-4 py-4 font-semibold text-slate-700">
                  Unassigned
                </td>

                <td className="px-4 py-4 font-semibold text-slate-700">
                  {formatDetailDate(phase.approvedAt || phase.approvalRequestedAt || project.createdAt)}
                </td>

                <td className="px-2 py-4">
                  <button
                    type="button"
                    className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Deliverable options"
                  >
                    <MoreVertical size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {deliverables.map((deliverable) => (
          <div
            key={deliverable.id}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200">
                <FileText size={17} />
              </span>

              <div className="min-w-0 flex-1">
                <strong className="block text-sm text-slate-950">
                  {deliverable.name}
                </strong>
                {deliverable.description ? (
                  <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                    {deliverable.description}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  <DeliverableStatusChip status={deliverable.status} />
                  {deliverable.link ? (
                    <a
                      href={deliverable.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-[#0064E0]"
                    >
                      Open link
                      <ExternalLink size={12} />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClientProjectPhaseAccordion({
  project,
  activePhaseId,
  setActivePhaseId,
}: {
  project: Project;
  activePhaseId?: string;
  setActivePhaseId: (phaseId: string) => void;
}) {
  const sortedPhases = [...project.phases].sort(
    (a, b) => a.phaseNumber - b.phaseNumber,
  );

  return (
    <div className="space-y-3">
      {sortedPhases.map((phase, index) => {
        const isOpen = phase.id === activePhaseId;
        const progress = phaseProgress(phase);

        return (
          <article
            key={phase.id}
            className={cn(
              "overflow-hidden rounded-[22px] border border-l-4 border-slate-200 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.04)]",
              phaseAccent(phase.status),
            )}
          >
            <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <button
                type="button"
                onClick={() => setActivePhaseId(phase.id)}
                className="flex min-w-0 flex-1 items-start gap-4 text-left"
              >
                <span
                  className={[
                    "grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-black ring-1",
                    phaseNumberTone(phase.status),
                  ].join(" ")}
                >
                  {phase.status === "APPROVED" ? (
                    <CheckCircle2 size={19} />
                  ) : (
                    index + 1
                  )}
                </span>

                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold tracking-[-0.04em] text-slate-950">
                    {phase.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm font-medium leading-6 text-slate-500">
                    {phase.description || "Project delivery phase."}
                  </p>

                  <div className="mt-3 h-1.5 max-w-xs overflow-hidden rounded-full bg-slate-200">
                    <span
                      className="block h-full rounded-full bg-[#0064E0]"
                      style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                    />
                  </div>
                </div>
              </button>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <PhaseStatusChip status={phase.status} />

                <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-slate-700">
                  {visibleDeliverablesForClient(phase).length} deliverable{visibleDeliverablesForClient(phase).length === 1 ? "" : "s"}
                </span>

                <Link
                  href={`/client/phases/${phase.id}`}
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:text-[#0064E0]"
                >
                  View Details
                </Link>

                <button
                  type="button"
                  onClick={() => setActivePhaseId(phase.id)}
                  className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-blue-200 hover:text-[#0064E0]"
                  aria-label={isOpen ? "Collapse phase" : "Expand phase"}
                >
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
            </div>

            {isOpen ? (
              <div className="border-t border-slate-100 p-4 sm:p-5">
                <DeliverablesTable phase={phase} project={project} />
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

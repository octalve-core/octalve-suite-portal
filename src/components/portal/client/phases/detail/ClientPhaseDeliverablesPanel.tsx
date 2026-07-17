import { ExternalLink, FileText } from "lucide-react";

import type { ProjectPhase } from "@/lib/types";
import {
  DELIVERABLE_STATUS_LABELS,
  deliverableLinkLabel,
  deliverableStatusTone,
  visibleDeliverablesForClient,
} from "./client-phase-detail-utils";

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

function safeExternalHref(value?: string | null) {
  const trimmed = String(value ?? "").trim();

  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.toString();
    }
  } catch {
    return "";
  }

  return "";
}
export function ClientPhaseDeliverablesPanel({
  phase,
}: {
  phase: ProjectPhase;
}) {
  const deliverables = visibleDeliverablesForClient(phase);

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_6px_16px_rgba(15,23,42,0.02)]">
      <div>
        <h2 className="text-xl font-medium tracking-[-0.035em] text-slate-900">
          Deliverables
        </h2>
        <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
          Client-visible files, links and outputs prepared for this phase.
        </p>
      </div>

      {deliverables.length ? (
        <div className="mt-5 grid gap-3">
          {deliverables.map((deliverable) => (
            <article
              key={deliverable.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-slate-500 ring-1 ring-slate-200">
                    <FileText size={18} />
                  </span>

                  <div className="min-w-0">
                    <strong className="block text-sm text-slate-950">
                      {deliverable.name}
                    </strong>

                    {deliverable.description ? (
                      <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                        {deliverable.description}
                      </p>
                    ) : null}

                    {safeExternalHref(deliverable.link) ? (
                      <a
                        href={safeExternalHref(deliverable.link)}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-[#0064E0] transition hover:bg-blue-100"
                      >
                        {deliverableLinkLabel(deliverable)}
                        <ExternalLink size={13} />
                      </a>
                    ) : null}
                  </div>
                </div>

                <DeliverableStatusChip status={deliverable.status} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
            <FileText size={22} />
          </div>
          <h3 className="mt-4 text-base font-medium tracking-[-0.025em] text-slate-800">
            No visible deliverables yet
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Deliverables will appear when Octalve makes them visible for your review.
          </p>
        </div>
      )}
    </section>
  );
}

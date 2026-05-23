import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckSquare,
  Clock3,
  Layers3,
} from "lucide-react";
import type { Project } from "@/lib/types";
import {
  buildRecentProjectActivity,
  formatProjectDateTime,
  type ProjectActivityItem,
} from "./client-projects-utils";

function activityIcon(item: ProjectActivityItem) {
  if (item.tone === "green") return <CheckSquare size={19} />;
  if (item.tone === "orange") return <Clock3 size={19} />;
  if (item.tone === "blue") return <Layers3 size={19} />;
  return <BriefcaseBusiness size={19} />;
}

function activityTone(item: ProjectActivityItem) {
  if (item.tone === "green") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (item.tone === "orange") return "bg-orange-50 text-orange-700 ring-orange-100";
  if (item.tone === "blue") return "bg-blue-50 text-[#0064E0] ring-blue-100";
  if (item.tone === "purple") return "bg-purple-50 text-purple-700 ring-purple-100";

  return "bg-slate-50 text-slate-600 ring-slate-200";
}

export function ClientRecentProjectActivity({
  projects,
  onSelect,
}: {
  projects: Project[];
  onSelect: (projectId: string) => void;
}) {
  const items = buildRecentProjectActivity(projects);

  if (!items.length) return null;

  return (
    <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.055)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold tracking-[-0.04em] text-slate-950">
          Recent Project Activity
        </h2>

        <Link
          href="/client/phases"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#0064E0]"
        >
          View all activity
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/client/projects/${item.projectId}`}
            onClick={() => onSelect(item.projectId)}
            className="group flex min-w-0 items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3 transition hover:border-blue-200 hover:bg-blue-50/40"
          >
            <span
              className={[
                "grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1",
                activityTone(item),
              ].join(" ")}
            >
              {activityIcon(item)}
            </span>

            <div className="min-w-0">
              <strong className="block truncate text-sm text-slate-950">
                {item.projectTitle}
              </strong>
              <span className="mt-1 block truncate text-xs font-semibold text-slate-500">
                {item.label}
              </span>
              <span className="mt-1 block truncate text-xs font-semibold text-slate-400">
                {formatProjectDateTime(item.date)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

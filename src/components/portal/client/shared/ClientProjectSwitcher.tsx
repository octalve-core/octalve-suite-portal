"use client";

import { useState } from "react";
import { ChevronDown, FolderKanban } from "lucide-react";
import { getPackageTitle } from "../../packageCatalog";
import { useApp } from "../../AppContext";
import {
  getBadgeClasses,
  getToneForProgress,
  projectProgress,
} from "../dashboard/client-dashboard-utils";

export function ClientProjectSwitcher() {
  const { clientProjects, selectedProject, setSelectedProjectId } = useApp();
  const [open, setOpen] = useState(false);

  if (clientProjects.length <= 1 || !selectedProject) return null;

  return (
    <div className="relative z-20">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-white/20 bg-white/12 px-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/18 sm:w-auto"
        aria-expanded={open}
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <FolderKanban size={17} />
          <span className="truncate">Project: {selectedProject.title}</span>
        </span>
        <ChevronDown size={17} />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+10px)] w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_28px_80px_rgba(15,23,42,0.20)]">
          {clientProjects.map((project) => {
            const progress = projectProgress(project);
            const active = project.id === selectedProject.id;

            return (
              <button
                key={project.id}
                type="button"
                onClick={() => {
                  setSelectedProjectId(project.id);
                  setOpen(false);
                }}
                className={[
                  "grid w-full gap-3 rounded-2xl p-4 text-left transition",
                  active ? "bg-blue-50" : "hover:bg-slate-50",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <strong className="block truncate text-sm font-semibold text-slate-950">
                      {project.title}
                    </strong>
                    <span className="mt-1 block text-xs font-medium text-slate-500">
                      {progress}% complete
                    </span>
                  </div>

                  <span
                    className={[
                      "inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold",
                      getBadgeClasses(getToneForProgress(progress)),
                    ].join(" ")}
                  >
                    {getPackageTitle(project.packageType)}
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <span
                    className="block h-full rounded-full bg-[#0064E0]"
                    style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

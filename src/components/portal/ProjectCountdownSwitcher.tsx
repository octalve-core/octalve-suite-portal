"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, FolderKanban } from "lucide-react";

import { useApp } from "./AppContext";
import { Badge, Select, statusClass, statusLabel } from "./UI";
import { ProjectDateCountdown, formatProjectDate } from "./ProjectDateCountdown";

export function ProjectCountdownSwitcher() {
  const {
    currentUser,
    selectedProject,
    clientProjects,
    state,
    setSelectedProjectId,
  } = useApp();

  const projects = useMemo(() => {
    return currentUser?.role === "CLIENT" ? clientProjects : state.projects;
  }, [clientProjects, currentUser?.role, state.projects]);

  const [projectId, setProjectId] = useState(selectedProject?.id ?? projects[0]?.id ?? "");

  useEffect(() => {
    if (selectedProject?.id) {
      setProjectId(selectedProject.id);
    }
  }, [selectedProject?.id]);

  const project = projects.find((item) => item.id === projectId) ?? projects[0];

  function handleChange(value: string) {
    setProjectId(value);

    if (value) {
      setSelectedProjectId(value);
    }
  }

  if (!projects.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
          <CalendarClock size={22} />
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-slate-950">
          No project timeline yet
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Project date and countdown details will appear once a project has been created or assigned.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(180px,0.8fr)_minmax(180px,0.8fr)]">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-800">Project</span>
          <div className="relative">
            <FolderKanban
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Select
              value={project?.id ?? ""}
              onChange={(event) => handleChange(event.target.value)}
              className="h-12 rounded-2xl border-slate-200 pl-11 text-sm"
            >
              {projects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </Select>
          </div>
        </label>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Target Date
          </span>
          <strong className="mt-1 block text-sm text-slate-950">
            {formatProjectDate(project?.targetDate)}
          </strong>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Status
          </span>
          {project ? (
            <Badge className={["mt-2", statusClass(project.status)].join(" ")}>
              {statusLabel(project.status)}
            </Badge>
          ) : (
            <strong className="mt-1 block text-sm text-slate-950">Not available</strong>
          )}
        </div>
      </div>

      <ProjectDateCountdown targetDate={project?.targetDate} />
    </div>
  );
}
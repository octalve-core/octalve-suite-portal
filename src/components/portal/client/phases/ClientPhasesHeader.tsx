import type { Project } from "@/lib/types";

export function ClientPhasesHeader({
  projects,
  selectedProjectId,
  onSelectProject,
}: {
  projects: Project[];
  selectedProjectId?: string;
  onSelectProject: (projectId: string) => void;
}) {
  return (
    <header className="pt-1">
      <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.065em] text-slate-950 sm:text-[42px]">
        Project Phases
      </h1>

      <p className="mt-2 max-w-3xl text-sm font-medium leading-7 text-slate-500 sm:text-[15px]">
        Track your project progress through each phase.
      </p>

      {projects.length ? (
        <div className="mt-5 inline-flex max-w-full items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <span className="mr-2 shrink-0 text-sm font-bold text-slate-950">
            Project:
          </span>

          <select
            value={selectedProjectId ?? projects[0]?.id ?? ""}
            onChange={(event) => onSelectProject(event.target.value)}
            className="h-12 min-w-0 max-w-[260px] bg-transparent text-sm font-semibold text-slate-900 outline-none"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </header>
  );
}

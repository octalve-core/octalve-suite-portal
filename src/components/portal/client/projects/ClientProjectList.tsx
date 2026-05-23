import { FolderKanban } from "lucide-react";
import type { Project } from "@/lib/types";
import { ClientProjectCard } from "./ClientProjectCard";

export function ClientProjectList({
  projects,
  onSelect,
}: {
  projects: Project[];
  onSelect: (projectId: string) => void;
}) {
  if (!projects.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
          <FolderKanban size={24} />
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-slate-950">
          No matching projects
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Adjust the search or filter. Approved projects will appear here once Octalve opens the workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
      {projects.map((project) => (
        <ClientProjectCard
          key={project.id}
          project={project}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

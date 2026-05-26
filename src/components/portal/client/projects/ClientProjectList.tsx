import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";

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
      <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center sm:p-10">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-[#0064E0] ring-1 ring-blue-100">
          <FolderKanban size={26} />
        </div>

        <h3 className="mt-4 text-xl font-semibold tracking-[-0.045em] text-slate-950">
          No matching projects
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
          Adjust your search or filters. Approved workspaces will appear here once Octalve opens the project for you.
        </p>

        <Link
          href="/client/projects/new"
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(0,100,224,0.08)] transition hover:bg-[#0052B8]"
        >
          <Plus size={16} />
          Start a Project
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
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
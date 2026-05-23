import { FileText } from "lucide-react";
import type { Project } from "@/lib/types";

export function ClientProjectNotesPanel({ project }: { project: Project }) {
  return (
    <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
          <FileText size={20} />
        </span>

        <div>
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
            Project Notes
          </h2>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            Client-facing project brief and delivery context.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-medium leading-7 text-slate-700">
        {project.clientBrief ||
          "No client-facing project notes have been added yet. Relevant notes will appear here when Octalve updates the project brief."}
      </div>
    </section>
  );
}

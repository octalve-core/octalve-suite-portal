import Link from "next/link";
import { Plus, FolderKanban } from "lucide-react";

export function ClientProjectsHeader({
  totalProjects,
  pendingRequests,
}: {
  totalProjects: number;
  pendingRequests: number;
}) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-blue-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6 sm:p-8">
        <div className="absolute -right-20 -top-28 h-64 w-64 rounded-full bg-[#0064E0]/10 blur-2xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.34em] text-[#0064E0]">
              Client Projects
            </span>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-5xl">
              Projects
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-[15px]">
              View active projects, delivery status, pending payment actions, phase approvals and submitted requests.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
              <FolderKanban size={17} className="mr-2 inline text-[#0064E0]" />
              {totalProjects} project{totalProjects === 1 ? "" : "s"} Â· {pendingRequests} request{pendingRequests === 1 ? "" : "s"}
            </div>

            <Link
              href="/client/projects/new"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-5 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(0,100,224,0.22)] transition hover:bg-[#0052B8]"
            >
              <Plus size={17} />
              Create Project
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

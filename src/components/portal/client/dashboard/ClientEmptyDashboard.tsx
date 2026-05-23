import Link from "next/link";
import { Plus } from "lucide-react";

export function ClientEmptyDashboard({
  title,
}: {
  title: string;
}) {
  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[32px] bg-[#0064E0] p-6 text-white shadow-[0_24px_70px_rgba(0,100,224,0.24)] sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-white/15 blur-2xl" />
        <div className="relative z-10">
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white/80">
            Client Workspace
          </span>
          <h1 className="mt-6 max-w-4xl text-[34px] font-semibold leading-[1.02] tracking-[-0.065em] sm:text-[44px] lg:text-[58px]">
            Welcome back.
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-white/82 sm:text-base">
            {title}
          </p>

          <Link
            href="/client/projects/new"
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-semibold text-[#0064E0] shadow-[0_16px_34px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5"
          >
            <Plus size={17} />
            Create Project
          </Link>
        </div>
      </section>

      <section className="mt-6 grid min-h-72 place-items-center rounded-[32px] border border-dashed border-slate-200 bg-white p-8 text-center shadow-[0_16px_38px_rgba(15,23,42,0.055)]">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">
            No active project yet
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm font-medium leading-7 text-slate-500">
            Create a project request and the Octalve team will review it before opening your workspace.
          </p>
        </div>
      </section>
    </main>
  );
}

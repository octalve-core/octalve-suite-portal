import Link from "next/link";
import { Plus } from "lucide-react";

export function ClientProjectsHeader() {
  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.065em] text-slate-950 sm:text-[42px]">
          Projects
        </h1>

        <p className="mt-2 max-w-3xl text-sm font-medium leading-7 text-slate-500 sm:text-[15px]">
          View your approved and active Octalve projects, delivery phases and progress in one place.
        </p>
      </div>

      <Link
        href="/client/projects/new"
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(0,100,224,0.08)] transition hover:bg-[#0052B8] lg:min-w-[180px]"
      >
        <Plus size={18} />
        Create Project
      </Link>
    </header>
  );
}

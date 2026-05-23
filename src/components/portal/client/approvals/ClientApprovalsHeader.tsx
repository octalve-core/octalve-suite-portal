import { CheckCircle2, Clock3, FileText } from "lucide-react";

export function ClientApprovalsHeader({
  awaiting,
  approved,
  changes,
}: {
  awaiting: number;
  approved: number;
  changes: number;
}) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-blue-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6 sm:p-8">
        <div className="absolute -right-20 -top-28 h-64 w-64 rounded-full bg-[#0064E0]/10 blur-2xl" />

        <div className="relative">
          <span className="text-xs font-bold uppercase tracking-[0.34em] text-[#0064E0]">
            Review Queue
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-5xl">
            Approvals
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-[15px]">
            Review submitted phases, approve completed work, or request correction from the delivery team.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
              <Clock3 size={13} />
              {awaiting} Awaiting Review
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              <CheckCircle2 size={13} />
              {approved} Approved
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
              <FileText size={13} />
              {changes} Changes Requested
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

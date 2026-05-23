import { Headphones } from "lucide-react";
import { SUPPORT_FAQS } from "./client-support-utils";

export function ClientSupportFaq() {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
          Helpful Answers
        </h2>
        <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
          Quick answers for common client workspace questions.
        </p>
      </div>

      <div className="grid gap-3 p-5 sm:p-6">
        {SUPPORT_FAQS.map((item) => (
          <details
            key={item.question}
            className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 open:bg-white open:shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
          >
            <summary className="flex cursor-pointer list-none items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
                <Headphones size={18} />
              </span>

              <span className="min-w-0 flex-1">
                <strong className="block text-sm font-semibold text-slate-950">
                  {item.question}
                </strong>
                <small className="mt-1 block text-xs font-semibold text-slate-400">
                  Click to expand
                </small>
              </span>

              <span className="text-sm font-bold text-[#0064E0] transition group-open:rotate-45">
                +
              </span>
            </summary>

            <p className="ml-[52px] mt-3 text-sm font-medium leading-6 text-slate-500">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

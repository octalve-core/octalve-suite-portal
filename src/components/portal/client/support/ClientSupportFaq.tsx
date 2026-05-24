import {
  ArrowRight,
  Headphones,
} from "lucide-react";

import type { WorkspacePublicSettings } from "@/lib/types";
import {
  getSupportGuideUrl,
  SUPPORT_FAQS,
} from "./client-support-utils";

export function ClientSupportFaq({
  settings,
}: {
  settings?: WorkspacePublicSettings | null;
}) {
  const guideUrl = getSupportGuideUrl(settings);

  const tones = [
    "bg-blue-50 text-[#0064E0] ring-blue-100",
    "bg-emerald-50 text-emerald-700 ring-emerald-100",
    "bg-orange-50 text-orange-700 ring-orange-100",
    "bg-violet-50 text-violet-700 ring-violet-100",
    "bg-red-50 text-red-700 ring-red-100",
  ];

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.055)] sm:p-6">
      <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
        Helpful Answers
      </h2>
      <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
        Quick answers to common questions.
      </p>

      <div className="mt-5 grid gap-3">
        {SUPPORT_FAQS.map((item, index) => (
          <details
            key={item.question}
            className="group rounded-2xl border border-slate-200 bg-white open:bg-slate-50"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
              <span
                className={[
                  "grid h-10 w-10 shrink-0 place-items-center rounded-2xl ring-1",
                  tones[index] ?? tones[0],
                ].join(" ")}
              >
                <Headphones size={18} />
              </span>

              <strong className="min-w-0 flex-1 text-sm font-semibold leading-6 text-slate-950">
                {item.question}
              </strong>

              <span className="text-lg font-semibold text-[#0064E0] transition group-open:rotate-45">
                +
              </span>
            </summary>

            <p className="px-4 pb-4 pl-[68px] text-sm font-medium leading-6 text-slate-500">
              {item.answer}
            </p>
          </details>
        ))}
      </div>

      <a
        href={guideUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-5 text-sm font-bold text-[#0064E0] transition hover:bg-blue-50"
      >
        View All FAQs
        <ArrowRight size={16} />
      </a>
    </section>
  );
}
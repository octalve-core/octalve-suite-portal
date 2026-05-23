import Link from "next/link";
import { ArrowRight, BookOpen, ShieldCheck } from "lucide-react";
import { SUPPORT_RESOURCES } from "./client-support-utils";

export function ClientSupportResources() {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
          Helpful Resources
        </h2>
        <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
          Fast links to the areas clients usually need while requesting help.
        </p>
      </div>

      <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-3">
        {SUPPORT_RESOURCES.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-200 hover:bg-blue-50"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#0064E0] ring-1 ring-blue-100">
              <BookOpen size={19} />
            </span>

            <strong className="mt-4 block text-base font-semibold tracking-[-0.035em] text-slate-950">
              {item.title}
            </strong>

            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              {item.description}
            </p>

            <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#0064E0]">
              {item.label}
              <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mx-5 mb-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:mx-6 sm:mb-6">
        <ShieldCheck size={19} className="mt-0.5 shrink-0 text-[#0064E0]" />
        <p className="m-0 text-sm font-medium leading-6 text-blue-900">
          For payment disputes, include the payment reference only. Do not send card details, OTPs, passwords, private keys, or admin credentials.
        </p>
      </div>
    </section>
  );
}

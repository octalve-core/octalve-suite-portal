import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CreditCard,
  Folder,
  MessageSquareText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import type { Project, ProjectPhase } from "@/lib/types";
import { SUPPORT_RESOURCES } from "./client-support-utils";

function ToolCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[110px] items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <strong className="block text-base font-semibold tracking-[-0.035em] text-slate-950">
          {title}
        </strong>
        <small className="mt-1 block text-sm font-medium leading-6 text-slate-500">
          {description}
        </small>
      </span>

      <ArrowRight size={17} className="text-[#0064E0] transition group-hover:translate-x-0.5" />
    </Link>
  );
}

function ResourceCard({
  title,
  description,
  href,
  label,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:bg-blue-50"
    >
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
        {icon}
      </span>

      <strong className="mt-4 block text-base font-semibold tracking-[-0.035em] text-slate-950">
        {title}
      </strong>

      <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
        {description}
      </p>

      <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#0064E0]">
        {label}
        <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
      </span>
    </a>
  );
}

export function ClientSupportResources({
  project,
  activePhase,
}: {
  project?: Project;
  activePhase?: ProjectPhase;
}) {
  const resourceIcons = [
    <BookOpen key="book" size={21} />,
    <ShieldCheck key="shield" size={21} />,
    <WalletCards key="wallet" size={21} />,
  ];

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.055)] sm:p-6">
      <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
        Support Tools
      </h2>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ToolCard
          title="Open Project"
          description="View project phases and details"
          href={project ? `/client/projects/${project.id}` : "/client/projects"}
          icon={<Folder size={21} />}
        />

        <ToolCard
          title="All Payments"
          description="View payment history and records"
          href="/client/payments"
          icon={<CreditCard size={21} />}
        />

        <ToolCard
          title="Phase Thread"
          description="Continue conversation in active thread"
          href={activePhase ? `/client/phases/${activePhase.id}` : "/client/phases"}
          icon={<MessageSquareText size={21} />}
        />
      </div>

      <h2 className="mt-7 text-xl font-semibold tracking-[-0.04em] text-slate-950">
        Helpful Resources
      </h2>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {SUPPORT_RESOURCES.map((item, index) => (
          <ResourceCard
            key={item.title}
            title={item.title}
            description={item.description}
            href={item.href}
            label={item.label}
            icon={resourceIcons[index] ?? <BookOpen size={21} />}
          />
        ))}
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <ShieldCheck size={19} className="mt-0.5 shrink-0 text-[#0064E0]" />
        <p className="m-0 text-sm font-semibold leading-6 text-blue-950">
          For payment disputes, include the payment reference only. Do not send card details, OTPs, passwords, private keys, or admin credentials.
        </p>
      </div>
    </section>
  );
}
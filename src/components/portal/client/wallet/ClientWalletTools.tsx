import Link from "next/link";
import {
  ArrowRight,
  Download,
  History,
  RefreshCcw,
} from "lucide-react";

function WalletToolRow({
  title,
  description,
  icon,
  href,
  disabled,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  disabled?: boolean;
}) {
  const content = (
    <>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <strong className="block truncate text-sm text-slate-950">
          {title}
        </strong>
        <small className="mt-1 block truncate text-xs font-semibold text-slate-500">
          {description}
        </small>
      </span>

      <ArrowRight size={16} className="shrink-0 text-slate-400" />
    </>
  );

  if (disabled || !href) {
    return (
      <button
        type="button"
        disabled
        className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left opacity-70"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 transition hover:border-blue-200 hover:bg-blue-50"
    >
      {content}
    </Link>
  );
}

export function ClientWalletTools() {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.055)]">
      <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
        Wallet Tools
      </h2>

      <div className="mt-4 grid gap-2">
        <WalletToolRow
          title="Payment History"
          description="View all payments and spending"
          icon={<History size={18} />}
          href="/client/payments"
        />

        <WalletToolRow
          title="Download Statement"
          description="Statement export route not connected yet"
          icon={<Download size={18} />}
          disabled
        />

        <WalletToolRow
          title="Auto Top-up"
          description="Automatic wallet funding is not active yet"
          icon={<RefreshCcw size={18} />}
          disabled
        />
      </div>
    </section>
  );
}

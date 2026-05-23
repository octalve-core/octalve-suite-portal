"use client";

import Link from "next/link";
import {
  ArrowRight,
  Download,
  History,
  Plus,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

function WalletToolRow({
  title,
  description,
  icon,
  href,
  disabled,
  onClick,
  loading,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  disabled?: boolean;
  onClick?: () => void;
  loading?: boolean;
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

  const className = [
    "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition",
    disabled
      ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-70"
      : "border-slate-100 bg-white hover:border-blue-200 hover:bg-blue-50",
  ].join(" ");

  if (disabled || loading) {
    return (
      <button type="button" disabled className={className}>
        {content}
      </button>
    );
  }

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export function ClientWalletTools({
  onFundWallet,
  onRefreshWallet,
  refreshing,
}: {
  onFundWallet: () => void;
  onRefreshWallet: () => void;
  refreshing: boolean;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.055)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
            Wallet Tools
          </h2>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            Safe wallet actions and available shortcuts.
          </p>
        </div>

        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          <ShieldCheck size={18} />
        </span>
      </div>

      <div className="mt-4 grid gap-2">
        <WalletToolRow
          title="Fund Wallet"
          description="Start secure provider checkout"
          icon={<Plus size={18} />}
          onClick={onFundWallet}
        />

        <WalletToolRow
          title="Refresh Wallet"
          description={refreshing ? "Refreshing ledger..." : "Reload server wallet balance"}
          icon={<RefreshCcw size={18} className={refreshing ? "animate-spin" : ""} />}
          onClick={onRefreshWallet}
          loading={refreshing}
        />

        <WalletToolRow
          title="Payment History"
          description="View project payments and spending"
          icon={<History size={18} />}
          href="/client/payments"
        />

        <WalletToolRow
          title="Download Statement"
          description="Disabled until server statement export route exists"
          icon={<Download size={18} />}
          disabled
        />

        <WalletToolRow
          title="Auto Top-up"
          description="Disabled until mandate/authorization flow exists"
          icon={<RefreshCcw size={18} />}
          disabled
        />
      </div>

      <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert size={17} className="mt-0.5 shrink-0 text-orange-700" />
          <p className="m-0 text-xs font-semibold leading-5 text-orange-800">
            Statement export and auto top-up are intentionally disabled because no authenticated backend routes exist for them yet. They should not be activated from frontend-only data.
          </p>
        </div>
      </div>
    </section>
  );
}

"use client";

import {
  Download,
  History,
  Plus,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

function WalletActionTile({
  title,
  icon,
  href,
  onClick,
  disabled,
  loading,
}: {
  title: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const content = (
    <>
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
        {icon}
      </span>
      <span className="mt-2 block text-center text-xs font-bold leading-4 text-slate-700">
        {title}
      </span>
    </>
  );

  const className = [
    "grid min-h-[92px] place-items-center rounded-3xl border p-3 text-center transition",
    disabled || loading
      ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-70"
      : "border-slate-100 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.025)] hover:border-blue-200 hover:bg-blue-50",
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
      <a href={href} className={className}>
        {content}
      </a>
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
    <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.025)] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.04em] text-slate-950">
            Quick Actions
          </h2>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            Common wallet actions in one place.
          </p>
        </div>

        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
          <ShieldCheck size={18} />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <WalletActionTile
          title="Add Money"
          icon={<Plus size={18} />}
          onClick={onFundWallet}
        />

        <WalletActionTile
          title="History"
          icon={<History size={18} />}
          href="#wallet-transactions"
        />

        <WalletActionTile
          title="Statement"
          icon={<Download size={18} />}
          href="/api/wallet/statement"
        />

        <WalletActionTile
          title="Refresh"
          icon={<RefreshCcw size={18} className={refreshing ? "animate-spin" : ""} />}
          onClick={onRefreshWallet}
          loading={refreshing}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#0064E0]" />
          <p className="m-0 text-xs font-semibold leading-5 text-blue-900">
            Automatic funding will only be enabled after it meets Octalve safety standards.
          </p>
        </div>
      </div>
    </section>
  );
}
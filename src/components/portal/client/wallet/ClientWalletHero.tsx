import { WalletCards } from "lucide-react";
import type { WalletSummary } from "@/lib/types";
import { formatWalletMoney } from "./client-wallet-utils";

export function ClientWalletHero({
  wallet,
  userName,
}: {
  wallet: WalletSummary | null;
  userName: string;
}) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-blue-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#000A16] via-[#001F4F] to-[#0064E0] p-6 text-white sm:p-8">
        <div className="absolute right-[-90px] top-[-110px] h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-[-120px] left-[-120px] h-72 w-72 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-white/80">
              Secure Wallet
            </span>

            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
              Octalve Wallet
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/75 sm:text-[15px]">
              View wallet balance, confirmed funding activity and ledger-backed project payment records.
            </p>
          </div>

          <div className="rounded-[26px] border border-white/15 bg-white/10 p-5 text-left backdrop-blur sm:min-w-[320px]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/55">
              <WalletCards size={17} />
              Available Balance
            </div>

            <strong className="mt-3 block text-4xl font-semibold tracking-[-0.065em]">
              {formatWalletMoney(wallet?.availableBalance ?? 0)}
            </strong>

            <p className="mt-2 text-sm font-medium text-white/65">
              {userName} · Ledger-backed balance
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

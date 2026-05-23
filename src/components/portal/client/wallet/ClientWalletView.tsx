"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";

import { api } from "@/lib/api";
import type { WalletSummary } from "@/lib/types";
import { useApp } from "../../AppContext";
import { ClientWalletFundingCard } from "./ClientWalletFundingCard";
import { ClientWalletHero } from "./ClientWalletHero";
import { ClientWalletLedger } from "./ClientWalletLedger";
import { ClientWalletTools } from "./ClientWalletTools";

export function ClientWalletView() {
  const { currentUser } = useApp();

  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadWallet(mode: "initial" | "refresh" = "initial") {
    if (mode === "initial") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const data = await api.wallet.get();
      setWallet(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load wallet.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadWallet("initial");
  }, []);

  const entries = useMemo(() => wallet?.entries ?? [], [wallet]);

  function scrollToFundingPanel() {
    document
      .getElementById("wallet-funding-panel")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function refreshWallet() {
    void loadWallet("refresh");
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid min-h-[360px] place-items-center rounded-[30px] border border-slate-200 bg-white p-8 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="inline-flex items-center gap-3 text-sm font-bold text-slate-500">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#0064E0]" />
            Loading wallet...
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-5">
        <header>
          <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.065em] text-slate-950 sm:text-[42px]">
            Wallet
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-7 text-slate-500 sm:text-[15px]">
            Manage your balance, top up your wallet, and track payment activity in one place.
          </p>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <ClientWalletHero
          wallet={wallet}
          userName={currentUser?.name ?? "Client"}
          onFundWallet={scrollToFundingPanel}
        />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <ClientWalletLedger
            entries={entries}
            refreshing={refreshing}
            onRefresh={refreshWallet}
          />

          <aside className="grid gap-4 self-start">
            <ClientWalletFundingCard onSuccess={() => loadWallet("refresh")} />

            <ClientWalletTools
              onFundWallet={scrollToFundingPanel}
              onRefreshWallet={refreshWallet}
              refreshing={refreshing}
            />

            <section className="rounded-[24px] border border-blue-100 bg-blue-50 p-5 shadow-[0_14px_34px_rgba(0,100,224,0.06)]">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 shrink-0 text-[#0064E0]" size={21} />
                <div>
                  <strong className="block text-sm font-bold text-blue-950">
                    Ledger-backed wallet
                  </strong>
                  <p className="mt-1 text-sm leading-6 text-blue-800">
                    Balance is calculated from server-side ledger entries. The client UI cannot credit, edit, or confirm wallet balance.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

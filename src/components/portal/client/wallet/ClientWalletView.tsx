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

function firstName(value?: string | null) {
  const cleaned = String(value ?? "").trim();
  if (!cleaned) return "there";

  return cleaned.split(/\s+/)[0] || "there";
}

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
    } catch {
      setError("Unable to load wallet safely. Please refresh or try again later.");
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
      <main className="mx-auto w-full max-w-[1180px] px-3 py-4 sm:px-6 lg:px-8 xl:max-w-[1500px]">
        <section className="grid min-h-[280px] place-items-center rounded-[26px] border border-slate-200 bg-white p-8 shadow-[0_8px_20px_rgba(15,23,42,0.025)]">
          <div className="inline-flex items-center gap-3 text-sm font-bold text-slate-500">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#0064E0]" />
            Loading wallet...
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1180px] px-3 py-4 sm:px-6 lg:px-8 xl:max-w-[1500px]">
      <div className="grid gap-4 sm:gap-5">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-500">
              Hello {firstName(currentUser?.name)}
            </p>
            <h1 className="mt-1 text-[30px] font-semibold leading-tight tracking-[-0.065em] text-slate-950 sm:text-[40px]">
              Wallet
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-500">
              Add money, view activity and manage project payments securely.
            </p>
          </div>
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

        <ClientWalletTools
          onFundWallet={scrollToFundingPanel}
          onRefreshWallet={refreshWallet}
          refreshing={refreshing}
        />

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
          <ClientWalletLedger
            entries={entries}
            refreshing={refreshing}
            onRefresh={refreshWallet}
          />

          <aside className="grid gap-4 self-start">
            <ClientWalletFundingCard onSuccess={() => loadWallet("refresh")} />

            <section className="rounded-[24px] border border-blue-100 bg-blue-50 p-4 shadow-[0_10px_24px_rgba(0,100,224,0.05)] sm:p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 shrink-0 text-[#0064E0]" size={21} />
                <div>
                  <strong className="block text-sm font-bold text-blue-950">
                    Protected wallet balance
                  </strong>
                  <p className="mt-1 text-sm leading-6 text-blue-800">
                    Every wallet balance is backed by verified transaction records, giving you a secure and dependable payment experience.
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
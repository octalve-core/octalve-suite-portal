"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, WalletCards } from "lucide-react";

import { api } from "@/lib/api";
import type { WalletSummary } from "@/lib/types";
import { useApp } from "../../AppContext";
import { ClientWalletFundingCard } from "./ClientWalletFundingCard";
import { ClientWalletHero } from "./ClientWalletHero";
import { ClientWalletLedger } from "./ClientWalletLedger";
import { ClientWalletMetrics } from "./ClientWalletMetrics";

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
      <div className="grid gap-6">
        <ClientWalletHero
          wallet={wallet}
          userName={currentUser?.name ?? "Client"}
        />

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <ClientWalletMetrics wallet={wallet} />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <ClientWalletLedger
            entries={entries}
            refreshing={refreshing}
            onRefresh={() => void loadWallet("refresh")}
          />

          <aside className="grid gap-4 self-start">
            <section className="rounded-[28px] border border-blue-100 bg-blue-50 p-5 shadow-[0_14px_34px_rgba(0,100,224,0.06)]">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 text-[#0064E0]" size={21} />
                <div>
                  <strong className="block text-sm font-bold text-blue-950">
                    Ledger-backed wallet
                  </strong>
                  <p className="mt-1 text-sm leading-6 text-blue-800">
                    The wallet does not trust browser values. Balance is calculated from server-side ledger entries only.
                  </p>
                </div>
              </div>
            </section>

            <ClientWalletFundingCard onSuccess={() => loadWallet("refresh")} />
          </aside>
        </section>
      </div>
    </main>
  );
}

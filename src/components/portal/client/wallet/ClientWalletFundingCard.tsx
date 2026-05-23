"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Landmark,
  Loader2,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import { api } from "@/lib/api";
import type { PaymentGatewaySetting } from "@/lib/types";
import {
  formatWalletMoney,
  getWalletFundingProviders,
  isSafeCheckoutUrl,
  type WalletFundingProvider,
} from "./client-wallet-utils";

export function ClientWalletFundingCard({
  onSuccess,
}: {
  onSuccess: () => Promise<void>;
}) {
  const [amount, setAmount] = useState("10000");
  const [provider, setProvider] = useState("");
  const [providers, setProviders] = useState<WalletFundingProvider[]>([]);
  const [providerLoading, setProviderLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProviders() {
      setProviderLoading(true);
      setError("");

      try {
        const gateways: PaymentGatewaySetting[] =
          await api.systemSettings.paymentGateways.list();

        const available = getWalletFundingProviders(gateways);

        if (!mounted) return;

        setProviders(available);
        setProvider((current) => current || available[0]?.provider || "");
      } catch (err) {
        if (mounted) {
          setProviders([]);
          setProvider("");
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load wallet funding providers.",
          );
        }
      } finally {
        if (mounted) setProviderLoading(false);
      }
    }

    void loadProviders();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleFundWallet() {
    const numericAmount = Math.round(Number(amount));

    setNotice("");
    setError("");

    if (!provider) {
      setError("No enabled wallet funding provider is currently available.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount < 1000) {
      setError("Minimum wallet funding amount is ?1,000.");
      return;
    }

    if (numericAmount > 5000000) {
      setError("Maximum wallet funding amount is ?5,000,000.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.wallet.initializeTopUp(numericAmount, provider);

      if (response.authorizationUrl) {
        if (!isSafeCheckoutUrl(response.authorizationUrl)) {
          setError("Checkout link could not be opened securely. Please try another provider.");
          return;
        }

        window.location.assign(response.authorizationUrl);
        return;
      }

      setNotice(response.message || "Wallet funding request created.");
      await onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start wallet funding. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const numericAmount = Math.round(Number(amount));
  const amountPreview = Number.isFinite(numericAmount)
    ? formatWalletMoney(numericAmount)
    : formatWalletMoney(0);

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
          <Landmark size={21} />
        </span>

        <div>
          <strong className="block text-sm font-bold text-slate-950">
            Fund wallet
          </strong>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Add funds through an enabled secure checkout provider. Wallet balance is credited only after server-side verification.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Amount
          </span>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="numeric"
            disabled={loading}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
            placeholder="10000"
          />
          <span className="mt-2 block text-xs font-semibold text-slate-400">
            Amount preview: {amountPreview}
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Provider
          </span>

          <select
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            disabled={loading || providerLoading || !providers.length}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
          >
            {providers.length ? (
              providers.map((item) => (
                <option key={item.provider} value={item.provider}>
                  {item.displayName}
                </option>
              ))
            ) : (
              <option value="">
                {providerLoading ? "Loading providers..." : "No enabled provider"}
              </option>
            )}
          </select>
        </label>

        <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <ShieldCheck size={19} className="mt-0.5 shrink-0 text-[#0064E0]" />
          <p className="m-0 text-sm font-medium leading-6 text-blue-900">
            Checkout is initialized by the backend only. Secret keys and verification logic are never stored in the browser.
          </p>
        </div>

        {notice ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-3 text-sm font-semibold text-orange-700">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleFundWallet}
          disabled={loading || providerLoading || !providers.length}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-5 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(0,100,224,0.22)] transition hover:bg-[#0052B8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Starting checkout...
            </>
          ) : (
            <>
              <CreditCard size={17} />
              Continue to Checkout
            </>
          )}
        </button>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CreditCard, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";

import { api } from "@/lib/api";
import {
  formatWalletMoney,
  getWalletFundingProviders,
  isSafeCheckoutUrl,
  parseFundingAmount,
  sanitizeFundingAmountInput,
  validateFundingAmount,
  type WalletFundingProvider,
} from "./client-wallet-utils";

const QUICK_AMOUNTS = [10000, 25000, 50000, 100000];

export function ClientWalletFundingCard({
  onSuccess,
}: {
  onSuccess: () => Promise<void> | void;
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
        const gateways = await api.systemSettings.paymentGateways.list();
        const enabledProviders = getWalletFundingProviders(gateways);

        if (!mounted) return;

        setProviders(enabledProviders);
        setProvider((current) => current || enabledProviders[0]?.provider || "");
      } catch {
        if (!mounted) return;

        setProviders([]);
        setError("Unable to load wallet funding options safely. Please try again later.");
      } finally {
        if (mounted) setProviderLoading(false);
      }
    }

    void loadProviders();

    return () => {
      mounted = false;
    };
  }, []);

  const validationError = useMemo(() => validateFundingAmount(amount), [amount]);
  const selectedProvider = providers.find((item) => item.provider === provider);

  async function handleSubmit() {
    const amountError = validateFundingAmount(amount);

    setNotice("");
    setError("");

    if (amountError) {
      setError(amountError);
      return;
    }

    if (!provider) {
      setError("Select an available wallet funding option.");
      return;
    }

    const numericAmount = parseFundingAmount(amount);

    setLoading(true);

    try {
      const response = await api.wallet.initializeTopUp(numericAmount, provider);

      if (response.authorizationUrl) {
        if (!isSafeCheckoutUrl(response.authorizationUrl, provider)) {
          setError("Checkout could not be opened safely. Please try another provider.");
          return;
        }

        window.location.assign(response.authorizationUrl);
        return;
      }

      setNotice(response.message || "Wallet funding request created.");
      await onSuccess();
    } catch {
      setError("Unable to start wallet funding safely. Please try again or use another provider.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="wallet-funding-panel"
      className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.025)] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.04em] text-slate-950">
            Add Money
          </h2>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            Fund your wallet through an approved checkout option.
          </p>
        </div>

        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
          <ShieldCheck size={18} />
        </span>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-800">
            Amount
          </span>

          <div className="flex h-12 overflow-hidden rounded-2xl border border-slate-200 bg-white transition focus-within:border-[#0064E0] focus-within:ring-4 focus-within:ring-blue-100">
            <span className="grid w-12 place-items-center border-r border-slate-200 text-sm font-black text-slate-500">
              NGN
            </span>

            <input
              value={amount}
              onChange={(event) =>
                setAmount(sanitizeFundingAmountInput(event.target.value))
              }
              inputMode="numeric"
              placeholder="10000"
              className="min-w-0 flex-1 px-4 text-sm font-semibold text-slate-950 outline-none"
            />
          </div>
        </label>

        <div>
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Quick Save
          </span>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {QUICK_AMOUNTS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setAmount(String(item))}
                className={[
                  "min-h-10 rounded-xl border px-3 text-xs font-bold transition",
                  parseFundingAmount(amount) === item
                    ? "border-[#0064E0] bg-blue-50 text-[#0064E0]"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-blue-50",
                ].join(" ")}
              >
                {formatWalletMoney(item, false)}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-800">
            Checkout Option
          </span>

          <div className="relative">
            <CreditCard
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#0064E0]"
              size={18}
            />
            <select
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
              disabled={providerLoading || !providers.length}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            >
              {providerLoading ? (
                <option>Loading options...</option>
              ) : providers.length ? (
                providers.map((item) => (
                  <option key={item.provider} value={item.provider}>
                    {item.displayName}
                  </option>
                ))
              ) : (
                <option>No option available</option>
              )}
            </select>
          </div>
        </label>

        {selectedProvider ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-medium leading-6 text-blue-900">
            Checkout will continue through {selectedProvider.displayName}. Your wallet is updated after Octalve confirms the funding status.
          </div>
        ) : null}

        {notice ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {notice}
          </div>
        ) : null}

        {error || validationError ? (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-semibold text-orange-700">
            {error || validationError}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={loading || providerLoading || !providers.length || Boolean(validationError)}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-5 text-sm font-black text-white shadow-[0_8px_18px_rgba(0,100,224,0.08)] transition hover:bg-[#0052B8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Preparing checkout...
            </>
          ) : (
            <>
              Continue
              <ArrowRight size={17} />
            </>
          )}
        </button>

        <div className="flex items-start gap-2 text-xs font-semibold leading-5 text-slate-500">
          <LockKeyhole size={14} className="mt-0.5 shrink-0" />
          <span>Payments are protected through approved checkout providers.</span>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#0064E0]" />
          <p className="m-0 text-xs font-semibold leading-5 text-slate-600">
            Every wallet transaction is protected and verified before any balance is updated.
          </p>
        </div>
      </div>
    </section>
  );
}
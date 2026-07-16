"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Landmark,
  Loader2,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import { api } from "@/lib/api";
import { resolvePaymentBankDetails } from "@/lib/payment-bank";
import type { PaymentMethodOption, Project } from "@/lib/types";
import { useApp } from "../../AppContext";
import { formatNaira } from "../dashboard/client-dashboard-utils";
import { ClientModalShell } from "./ClientModalShell";
import { ClientPaymentCopyRow } from "./ClientPaymentCopyRow";

type PaymentPanel = "BANK" | "ONLINE" | "WALLET";

function isSafeGatewayRedirect(value?: string) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function ProviderBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
      {children}
    </span>
  );
}

function PaymentAccordionHeader({
  title,
  subtitle,
  icon,
  open,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition",
        open
          ? "border-blue-200 bg-blue-50"
          : "border-slate-200 bg-slate-50 hover:border-blue-100 hover:bg-blue-50/40",
      ].join(" ")}
      aria-expanded={open}
    >
      <span
        className={[
          "grid h-11 w-11 shrink-0 place-items-center rounded-full ring-1",
          open
            ? "bg-white text-[#0064E0] ring-blue-100"
            : "bg-white text-slate-600 ring-slate-200",
        ].join(" ")}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <strong className="block text-base font-medium tracking-[-0.03em] text-slate-800">
          {title}
        </strong>
        <small className="mt-1 block text-sm font-medium leading-5 text-slate-500">
          {subtitle}
        </small>
      </span>

      <ChevronDown
        size={19}
        className={[
          "shrink-0 text-slate-400 transition",
          open ? "rotate-180 text-[#0064E0]" : "",
        ].join(" ")}
      />
    </button>
  );
}

export function ClientManualPaymentModal({
  project,
  paymentId,
  onClose,
}: {
  project: Project;
  paymentId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { markPaymentPaid } = useApp();

  const [methods, setMethods] = useState<PaymentMethodOption[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<PaymentPanel | "">("");
  const [manualLoading, setManualLoading] = useState(false);
  const [initializingProvider, setInitializingProvider] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const payment = project.payments.find((item) => item.id === paymentId);

  useEffect(() => {
    let mounted = true;

    async function loadMethods() {
      if (!payment || payment.status !== "UNPAID") {
        setMethodsLoading(false);
        return;
      }

      setMethodsLoading(true);
      setError("");

      try {
        const data = await api.payments.methods(paymentId);

        if (mounted) {
          setMethods(data);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load available payment options.",
          );
        }
      } finally {
        if (mounted) setMethodsLoading(false);
      }
    }

    void loadMethods();

    return () => {
      mounted = false;
    };
  }, [payment?.id, payment?.status]);

  const bankMethod = useMemo(
    () =>
      methods.find(
        (method) => method.provider === "MANUAL_BANK" && method.isEnabled,
      ),
    [methods],
  );

  const onlineMethods = useMemo(
    () =>
      methods.filter(
        (method) =>
          method.provider !== "MANUAL_BANK" &&
          method.provider !== "WALLET" &&
          method.isEnabled &&
          method.isReady &&
          method.isAutomated,
      ),
    [methods],
  );

  const walletMethod = useMemo(
    () =>
      methods.find(
        (method) => method.provider === "WALLET" && method.isEnabled,
      ),
    [methods],
  );

  useEffect(() => {
    if (activePanel || methodsLoading) return;

    if (bankMethod) {
      setActivePanel("BANK");
      return;
    }

    if (onlineMethods.length) {
      setActivePanel("ONLINE");
      return;
    }

    if (walletMethod) {
      setActivePanel("WALLET");
    }
  }, [activePanel, bankMethod, methodsLoading, onlineMethods.length, walletMethod]);

  if (!payment) return null;

  const bank = resolvePaymentBankDetails(payment);

  async function handleManualSubmit() {
    setManualLoading(true);
    setNotice("");
    setError("");

    try {
      await markPaymentPaid(paymentId);
      setNotice("Your bank transfer has been submitted for confirmation.");
      window.setTimeout(() => {
        onClose();
        router.refresh();
      }, 650);
    } catch (err) {
      void err;
      setError("Unable to submit payment confirmation. Please try again or contact support.");
    } finally {
      setManualLoading(false);
    }
  }

  async function handleInitialize(provider: string) {
    if (provider === "MANUAL_BANK") return;

    setInitializingProvider(provider);
    setNotice("");
    setError("");

    try {
      const response = await api.payments.initialize(paymentId, provider);

      if (response.authorizationUrl) {
        if (!isSafeGatewayRedirect(response.authorizationUrl)) {
          setError("Checkout link could not be opened securely. Please use another method.");
          return;
        }

        window.location.assign(response.authorizationUrl);
        return;
      }

      if (provider === "WALLET") {
        setNotice("Payment completed from Octalve Wallet.");

        window.setTimeout(() => {
          onClose();
          router.push("/client/payments");
          router.refresh();
        }, 750);

        return;
      }

      setError("We could not open the checkout page. Please try another payment method.");
    } catch (err) {
      void err;
      setError("Unable to start payment. Please try another method.");
    } finally {
      setInitializingProvider("");
    }
  }

  const hasAnyMethod = Boolean(bankMethod || onlineMethods.length || walletMethod);
  const isPayable = payment.status === "UNPAID";

  return (
    <ClientModalShell title="Payment Details" onClose={onClose} maxWidth="max-w-[560px]">
      <div className="grid gap-5">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-red-50 text-[#E61525] ring-1 ring-red-100">
            <CreditCard size={24} />
          </span>

          <div className="min-w-0">
            <strong className="block text-lg font-medium tracking-[-0.035em] text-slate-900">
              {payment.type === "DEPOSIT" ? "Deposit Payment" : "Balance Payment"}
            </strong>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
              Choose an enabled payment method. Checkout and wallet deductions are processed only through the secure backend.
            </p>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[10px] font-medium uppercase tracking-[0.09em] text-slate-400">
              Amount Due
            </span>
            <strong className="text-[22px] font-medium tracking-[-0.04em] text-slate-700">
              {formatNaira(payment.amount)}
            </strong>
          </div>
        </div>

        {notice ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-semibold text-orange-700">
            {error}
          </div>
        ) : null}

        {!isPayable ? (
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4">
              <span className="text-[10px] font-medium uppercase tracking-[0.09em] text-slate-400">
                Status
              </span>
              <strong className="text-sm font-semibold text-slate-950">
                {payment.status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (value) => value.toUpperCase())}
              </strong>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4">
              <span className="text-[10px] font-medium uppercase tracking-[0.09em] text-slate-400">
                Project
              </span>
              <strong className="max-w-[260px] truncate text-right text-sm font-semibold text-slate-950">
                {project.title}
              </strong>
            </div>

            <ClientPaymentCopyRow label="Payment Reference" value={payment.reference} />

            {payment.provider ? (
              <ClientPaymentCopyRow label="Provider" value={String(payment.provider)} />
            ) : null}

            {payment.note ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium leading-6 text-slate-600">
                {payment.note}
              </div>
            ) : null}
          </div>
        ) : methodsLoading ? (
          <div className="flex min-h-28 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500">
            <Loader2 size={18} className="animate-spin" />
            Loading payment options...
          </div>
        ) : hasAnyMethod ? (
          <div className="grid gap-3">
            {bankMethod ? (
              <section className="grid gap-3">
                <PaymentAccordionHeader
                  title="Bank Transfer"
                  subtitle="Transfer to Octalve account and submit for confirmation."
                  icon={<Landmark size={21} />}
                  open={activePanel === "BANK"}
                  onClick={() => setActivePanel(activePanel === "BANK" ? "" : "BANK")}
                />

                {activePanel === "BANK" ? (
                  <div className="grid gap-3 rounded-2xl border border-blue-100 bg-white p-4">
                    <ProviderBadge>Manual confirmation</ProviderBadge>

                    <ClientPaymentCopyRow label="Bank Name" value={bank.bankName} />
                    <ClientPaymentCopyRow label="Account Name" value={bank.accountName} />
                    <ClientPaymentCopyRow label="Account Number" value={bank.accountNumber} />
                    <ClientPaymentCopyRow label="Payment Reference" value={payment.reference} />

                    <button
                      type="button"
                      disabled={manualLoading || Boolean(initializingProvider)}
                      onClick={handleManualSubmit}
                      className="mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(0,100,224,0.08)] transition hover:bg-[#0052B8] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {manualLoading ? (
                        <>
                          <Loader2 size={17} className="animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={17} />
                          I have paid
                        </>
                      )}
                    </button>
                  </div>
                ) : null}
              </section>
            ) : null}

            {onlineMethods.length ? (
              <section className="grid gap-3">
                <PaymentAccordionHeader
                  title="Online Payment"
                  subtitle="Continue through an enabled secure checkout gateway."
                  icon={<CreditCard size={21} />}
                  open={activePanel === "ONLINE"}
                  onClick={() => setActivePanel(activePanel === "ONLINE" ? "" : "ONLINE")}
                />

                {activePanel === "ONLINE" ? (
                  <div className="grid gap-3 rounded-2xl border border-blue-100 bg-white p-4">
                    {onlineMethods.map((method) => {
                      const initializing = initializingProvider === method.provider;

                      return (
                        <button
                          key={method.provider}
                          type="button"
                          disabled={Boolean(initializingProvider)}
                          onClick={() => handleInitialize(method.provider)}
                          className="flex min-h-16 w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-left transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span>
                            <strong className="block text-base font-semibold text-slate-950">
                              {method.displayName}
                            </strong>
                            <small className="mt-1 block text-sm font-medium text-slate-500">
                              Secure checkout via {method.displayName}
                            </small>
                          </span>

                          {initializing ? (
                            <Loader2 size={18} className="animate-spin text-[#0064E0]" />
                          ) : (
                            <ArrowUpRight size={18} className="text-[#0064E0]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            ) : null}

            {walletMethod ? (
              <section className="grid gap-3">
                <PaymentAccordionHeader
                  title="Octalve Wallet"
                  subtitle={
                    walletMethod.isReady
                      ? "Pay instantly from your wallet balance."
                      : walletMethod.unavailableReason ?? "Wallet is currently unavailable for this payment."
                  }
                  icon={<WalletCards size={21} />}
                  open={activePanel === "WALLET"}
                  onClick={() => setActivePanel(activePanel === "WALLET" ? "" : "WALLET")}
                />

                {activePanel === "WALLET" ? (
                  <div className="grid gap-4 rounded-2xl border border-blue-100 bg-white p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <span className="block text-[10px] font-medium uppercase tracking-[0.09em] text-slate-400">
                          Wallet Balance
                        </span>
                        <strong className="mt-1 block text-lg font-semibold text-slate-950">
                          {formatNaira(walletMethod.walletBalance ?? 0)}
                        </strong>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <span className="block text-[10px] font-medium uppercase tracking-[0.09em] text-slate-400">
                          Required Amount
                        </span>
                        <strong className="mt-1 block text-lg font-semibold text-slate-950">
                          {formatNaira(walletMethod.requiredAmount ?? payment.amount)}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                      <ShieldCheck size={19} className="mt-0.5 shrink-0 text-[#0064E0]" />
                      <p className="m-0 text-sm font-medium leading-6 text-blue-900">
                        Wallet payment is confirmed only by server-side ledger deduction. Browser values are not trusted.
                      </p>
                    </div>

                    {walletMethod.isReady ? (
                      <button
                        type="button"
                        disabled={Boolean(initializingProvider)}
                        onClick={() => handleInitialize("WALLET")}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(0,100,224,0.08)] transition hover:bg-[#0052B8] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {initializingProvider === "WALLET" ? (
                          <>
                            <Loader2 size={17} className="animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <WalletCards size={17} />
                            Pay from Wallet
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => router.push("/client/wallet")}
                        className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#0064E0]/20 bg-blue-50 px-5 text-sm font-semibold text-[#0064E0] transition hover:bg-blue-100"
                      >
                        Fund Wallet
                      </button>
                    )}
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
            No payment method is currently enabled for this payment. Please contact Octalve support.
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          disabled={manualLoading || Boolean(initializingProvider)}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-emerald-500 bg-white px-5 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Leave
        </button>
      </div>
    </ClientModalShell>
  );
}

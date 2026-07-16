"use client";

import type React from "react";
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
import type { PaymentMethodOption, Project, ProjectPayment } from "@/lib/types";
import { useApp } from "../../../AppContext";
import { ClientPaymentCopyRow } from "../../shared/ClientPaymentCopyRow";
import {
  canMarkPaymentForProject,
  formatPaymentMoney,
  groupPaymentMethods,
  isSafeGatewayRedirect,
  type PaymentPanel,
} from "./client-payment-detail-utils";

function MethodHeader({
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

function ReadyBadge({ ready }: { ready: boolean }) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
        ready
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-500",
      ].join(" ")}
    >
      {ready ? "Available" : "Not Ready"}
    </span>
  );
}

export function ClientPaymentMethodsPanel({
  payment,
  project,
}: {
  payment: ProjectPayment;
  project: Project;
}) {
  const router = useRouter();
  const { markPaymentPaid, refreshWorkspaceData } = useApp();

  const [methods, setMethods] = useState<PaymentMethodOption[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(payment.status === "UNPAID");
  const [activePanel, setActivePanel] = useState<PaymentPanel | "">("");
  const [manualLoading, setManualLoading] = useState(false);
  const [initializingProvider, setInitializingProvider] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadMethods() {
      if (payment.status !== "UNPAID") {
        setLoadingMethods(false);
        return;
      }

      setLoadingMethods(true);
      setError("");

      try {
        const data = await api.payments.methods(payment.id);
        if (mounted) setMethods(data);
      } catch (err) {
        if (mounted) {
          void err;
          setError("Payment methods are temporarily unavailable. Please refresh or contact support.");
        }
      } finally {
        if (mounted) setLoadingMethods(false);
      }
    }

    void loadMethods();

    return () => {
      mounted = false;
    };
  }, [payment.id, payment.status]);

  const grouped = useMemo(() => groupPaymentMethods(methods), [methods]);

  useEffect(() => {
    if (activePanel || loadingMethods) return;

    if (grouped.bankMethod) {
      setActivePanel("BANK");
      return;
    }

    if (grouped.onlineMethods.length) {
      setActivePanel("ONLINE");
      return;
    }

    if (grouped.walletMethod) {
      setActivePanel("WALLET");
    }
  }, [
    activePanel,
    grouped.bankMethod,
    grouped.onlineMethods.length,
    grouped.walletMethod,
    loadingMethods,
  ]);

  const bank = resolvePaymentBankDetails(payment);
  const canMarkPaid = canMarkPaymentForProject(project, payment);
  const hasAnyMethod = Boolean(
    grouped.bankMethod || grouped.onlineMethods.length || grouped.walletMethod,
  );

  async function handleManualSubmit() {
    if (!canMarkPaid) return;

    const ok = window.confirm("Confirm that you have made this bank transfer?");

    if (!ok) return;

    setManualLoading(true);
    setNotice("");
    setError("");

    try {
      await markPaymentPaid(payment.id);
      setNotice("Your bank transfer has been submitted for confirmation.");
      router.refresh();
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
      const response = await api.payments.initialize(payment.id, provider);

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
        await refreshWorkspaceData();
        window.setTimeout(() => {
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

  if (payment.status !== "UNPAID") {
    return (
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.025)]">
        <h2 className="text-xl font-medium tracking-[-0.035em] text-slate-900">
          Payment Record
        </h2>
        <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
          This payment is not currently open for checkout.
        </p>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
          {payment.status === "PENDING_CONFIRMATION"
            ? "Your payment has been submitted and is awaiting Octalve finance confirmation."
            : payment.status === "CONFIRMED"
              ? "This payment has been confirmed."
              : "This payment is not available for checkout. Contact support if you believe this is an error."}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.025)]">
      <div>
        <h2 className="text-xl font-medium tracking-[-0.035em] text-slate-900">
          Complete Payment
        </h2>
        <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
          Choose an enabled method. Online checkout and wallet payment are processed only through the backend.
        </p>
      </div>

      {notice ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-semibold text-orange-700">
          {error}
        </div>
      ) : null}

      {loadingMethods ? (
        <div className="mt-5 flex min-h-28 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500">
          <Loader2 size={18} className="animate-spin" />
          Loading payment methods...
        </div>
      ) : hasAnyMethod ? (
        <div className="mt-5 grid gap-3">
          {grouped.bankMethod ? (
            <section className="grid gap-3">
              <MethodHeader
                title="Bank Transfer"
                subtitle="Transfer to Octalve account and submit for confirmation."
                icon={<Landmark size={21} />}
                open={activePanel === "BANK"}
                onClick={() => setActivePanel(activePanel === "BANK" ? "" : "BANK")}
              />

              {activePanel === "BANK" ? (
                <div className="grid gap-3 rounded-2xl border border-blue-100 bg-white p-4">
                  <ReadyBadge ready />

                  <ClientPaymentCopyRow label="Bank Name" value={bank.bankName} />
                  <ClientPaymentCopyRow label="Account Name" value={bank.accountName} />
                  <ClientPaymentCopyRow label="Account Number" value={bank.accountNumber} />
                  <ClientPaymentCopyRow label="Payment Reference" value={payment.reference} />

                  <button
                    type="button"
                    disabled={manualLoading || Boolean(initializingProvider) || !canMarkPaid}
                    onClick={() => void handleManualSubmit()}
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

          {grouped.onlineMethods.length ? (
            <section className="grid gap-3">
              <MethodHeader
                title="Online Payment"
                subtitle="Continue through an enabled secure checkout gateway."
                icon={<CreditCard size={21} />}
                open={activePanel === "ONLINE"}
                onClick={() => setActivePanel(activePanel === "ONLINE" ? "" : "ONLINE")}
              />

              {activePanel === "ONLINE" ? (
                <div className="grid gap-3 rounded-2xl border border-blue-100 bg-white p-4">
                  {grouped.onlineMethods.map((method) => {
                    const initializing = initializingProvider === method.provider;

                    return (
                      <button
                        key={method.provider}
                        type="button"
                        disabled={Boolean(initializingProvider)}
                        onClick={() => void handleInitialize(String(method.provider))}
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

          {grouped.walletMethod ? (
            <section className="grid gap-3">
              <MethodHeader
                title="Octalve Wallet"
                subtitle={
                  grouped.walletMethod.isReady
                    ? "Pay instantly from your wallet balance."
                    : grouped.walletMethod.unavailableReason ?? "Wallet is currently unavailable."
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
                        {formatPaymentMoney(grouped.walletMethod.walletBalance ?? 0)}
                      </strong>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <span className="block text-[10px] font-medium uppercase tracking-[0.09em] text-slate-400">
                        Required Amount
                      </span>
                      <strong className="mt-1 block text-lg font-semibold text-slate-950">
                        {formatPaymentMoney(grouped.walletMethod.requiredAmount ?? payment.amount)}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <ShieldCheck size={19} className="mt-0.5 shrink-0 text-[#0064E0]" />
                    <p className="m-0 text-sm font-medium leading-6 text-blue-900">
                      Wallet payment is confirmed only by server-side ledger deduction. Browser values are not trusted.
                    </p>
                  </div>

                  {grouped.walletMethod.isReady ? (
                    <button
                      type="button"
                      disabled={Boolean(initializingProvider)}
                      onClick={() => void handleInitialize("WALLET")}
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
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
          No payment method is currently enabled for this payment. Please contact Octalve support.
        </div>
      )}
    </section>
  );
}
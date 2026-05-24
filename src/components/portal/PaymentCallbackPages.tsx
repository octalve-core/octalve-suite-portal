"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { api } from "@/lib/api";
import type { PaymentVerifyResponse } from "@/lib/types";

type CallbackStatus = "VERIFYING" | "CONFIRMED" | "FAILED";

function cleanQueryValue(value?: string, max = 180) {
  return String(value ?? "").trim().slice(0, max);
}

function shortReference(value?: string) {
  const cleaned = cleanQueryValue(value);

  if (!cleaned) return "";
  if (cleaned.length <= 22) return cleaned;

  return `${cleaned.slice(0, 12)}...${cleaned.slice(-7)}`;
}

function statusTone(status: CallbackStatus) {
  if (status === "CONFIRMED") {
    return {
      hero: "from-emerald-700 via-emerald-600 to-[#0064E0]",
      iconWrap: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      panel: "border-emerald-200 bg-emerald-50 text-emerald-800",
      label: "Payment verified",
      title: "Payment confirmed",
    };
  }

  if (status === "FAILED") {
    return {
      hero: "from-red-700 via-red-600 to-slate-950",
      iconWrap: "bg-red-50 text-red-700 ring-red-100",
      panel: "border-red-200 bg-red-50 text-red-800",
      label: "Needs attention",
      title: "Payment not confirmed",
    };
  }

  return {
    hero: "from-slate-950 via-[#003C9A] to-[#0064E0]",
    iconWrap: "bg-blue-50 text-[#0064E0] ring-blue-100",
    panel: "border-blue-200 bg-blue-50 text-blue-900",
    label: "Checking payment",
    title: "Verifying payment",
  };
}

function StatusIcon({ status }: { status: CallbackStatus }) {
  if (status === "CONFIRMED") return <CheckCircle2 size={26} />;
  if (status === "FAILED") return <XCircle size={26} />;

  return <Loader2 size={26} className="animate-spin" />;
}

function ReferenceRow({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  const cleaned = cleanQueryValue(value);

  if (!cleaned) return null;

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(cleaned);
    } catch {
      // Clipboard access may fail on some devices. The visible reference remains available.
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
            {label}
          </span>
          <strong className="mt-1 block break-all text-sm font-semibold text-slate-800">
            {shortReference(cleaned)}
          </strong>
        </div>

        <button
          type="button"
          onClick={() => void copyReference()}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0064E0]"
          aria-label={`Copy ${label}`}
        >
          <Copy size={15} />
        </button>
      </div>
    </div>
  );
}

function ResultShell({
  provider,
  status,
  message,
  children,
  paymentId,
}: {
  provider: string;
  status: CallbackStatus;
  message: string;
  children?: ReactNode;
  paymentId?: string;
}) {
  const tone = statusTone(status);
  const confirmed = status === "CONFIRMED";
  const failed = status === "FAILED";

  return (
    <main className="mx-auto w-full max-w-[980px] px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/client/payments"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[#0064E0]"
      >
        <ArrowLeft size={17} />
        Back to Payments
      </Link>

      <section className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
        <div
          className={[
            "relative overflow-hidden bg-gradient-to-br p-6 text-white sm:p-8",
            tone.hero,
          ].join(" ")}
        >
          <div className="absolute right-[-90px] top-[-100px] h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-[-120px] left-[20%] h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white">
              {provider} Payment
            </span>

            <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-white text-[#0064E0] shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                <StatusIcon status={status} />
              </span>

              <div className="min-w-0">
                <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.065em] sm:text-[44px]">
                  {tone.title}
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/80 sm:text-[15px]">
                  {message}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-6">
          <div className={["rounded-3xl border p-5", tone.panel].join(" ")}>
            <div className="flex gap-3">
              <span
                className={[
                  "grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1",
                  tone.iconWrap,
                ].join(" ")}
              >
                {confirmed ? (
                  <ShieldCheck size={20} />
                ) : failed ? (
                  <AlertCircle size={20} />
                ) : (
                  <Clock3 size={20} />
                )}
              </span>

              <div>
                <strong className="block text-sm font-black text-slate-950">
                  {tone.label}
                </strong>

                <p className="mt-1 text-sm font-semibold leading-6">
                  {confirmed
                    ? "Your payment has been confirmed and your project access has been updated."
                    : failed
                      ? "If your account was debited, do not retry repeatedly. Keep your reference and contact support."
                      : `Octalve is confirming this payment with ${provider}. Please wait while the check completes.`}
                </p>
              </div>
            </div>
          </div>

          {children}

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-[#0064E0]" size={21} />
              <div>
                <strong className="block text-sm font-bold text-slate-950">
                  Secure Payment Check
                </strong>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                  Your payment result is confirmed through Octalve approved payment verification before any project access is updated.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {paymentId ? (
              <Link
                href={`/client/payments/${paymentId}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-5 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(0,100,224,0.22)] transition hover:bg-[#0052B8]"
              >
                <CreditCard size={17} />
                Open Payment
              </Link>
            ) : (
              <Link
                href="/client/payments"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-5 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(0,100,224,0.22)] transition hover:bg-[#0052B8]"
              >
                <CreditCard size={17} />
                Open Payments
              </Link>
            )}

            <Link
              href="/client"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0064E0]"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export function PaystackPaymentCallbackPage({
  reference,
  paymentId,
}: {
  reference?: string;
  paymentId?: string;
}) {
  const verifyStartedRef = useRef(false);
  const safeReference = cleanQueryValue(reference, 160);
  const safePaymentId = cleanQueryValue(paymentId, 160);

  const [result, setResult] = useState<PaymentVerifyResponse | null>(null);
  const [status, setStatus] = useState<CallbackStatus>("VERIFYING");
  const [message, setMessage] = useState("Confirming your Paystack payment securely...");

  useEffect(() => {
    if (verifyStartedRef.current) return;

    verifyStartedRef.current = true;
    let mounted = true;

    async function verifyPayment() {
      if (!safeReference) {
        setStatus("FAILED");
        setMessage(
          "Paystack did not return a payment reference to this page. If your account was debited, contact support with your debit notification.",
        );
        return;
      }

      try {
        const response = await api.payments.verifyPaystack({
          reference: safeReference,
          paymentId: safePaymentId || undefined,
        });

        if (!mounted) return;

        setResult(response);

        if (response.status === "CONFIRMED" || response.status === "ALREADY_CONFIRMED") {
          setStatus("CONFIRMED");
          setMessage(response.message);
          return;
        }

        setStatus("FAILED");
        setMessage(response.message || "Payment could not be confirmed at this time.");
      } catch (error) {
        if (!mounted) return;

        setStatus("FAILED");
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to confirm payment at this time. Please contact support if your account was debited.",
        );
      }
    }

    void verifyPayment();

    return () => {
      mounted = false;
    };
  }, [safePaymentId, safeReference]);

  const resolvedPaymentId = result?.paymentId || safePaymentId;

  return (
    <ResultShell
      provider="Paystack"
      status={status}
      message={message}
      paymentId={resolvedPaymentId}
    >
      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <ReferenceRow label="Paystack Reference" value={safeReference} />
        <ReferenceRow label="Payment Record" value={resolvedPaymentId} />
        <ReferenceRow label="Payment Reference" value={result?.paymentReference} />
        <ReferenceRow label="Transaction Reference" value={result?.transactionReference} />
      </div>
    </ResultShell>
  );
}

export function FlutterwavePaymentCallbackPage({
  status,
  txRef,
  transactionId,
  paymentId,
}: {
  status?: string;
  txRef?: string;
  transactionId?: string;
  paymentId?: string;
}) {
  const verifyStartedRef = useRef(false);
  const safeProviderStatus = cleanQueryValue(status, 80);
  const safeTxRef = cleanQueryValue(txRef, 160);
  const safeTransactionId = cleanQueryValue(transactionId, 80);
  const safePaymentId = cleanQueryValue(paymentId, 160);

  const [result, setResult] = useState<PaymentVerifyResponse | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<CallbackStatus>("VERIFYING");
  const [message, setMessage] = useState("Confirming your Flutterwave payment securely...");

  useEffect(() => {
    if (verifyStartedRef.current) return;

    verifyStartedRef.current = true;
    let mounted = true;

    async function verifyPayment() {
      if (!safeTxRef && !safeTransactionId && !safePaymentId) {
        setVerificationStatus("FAILED");
        setMessage(
          "Flutterwave did not return a payment reference to this page. If your account was debited, contact support with your debit notification.",
        );
        return;
      }

      try {
        const response = await api.payments.verifyFlutterwave({
          txRef: safeTxRef || undefined,
          transactionId: safeTransactionId || undefined,
          paymentId: safePaymentId || undefined,
        });

        if (!mounted) return;

        setResult(response);

        if (response.status === "CONFIRMED" || response.status === "ALREADY_CONFIRMED") {
          setVerificationStatus("CONFIRMED");
          setMessage(response.message);
          return;
        }

        setVerificationStatus("FAILED");
        setMessage(response.message || "Payment could not be confirmed at this time.");
      } catch (error) {
        if (!mounted) return;

        setVerificationStatus("FAILED");
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to confirm payment at this time. Please contact support if your account was debited.",
        );
      }
    }

    void verifyPayment();

    return () => {
      mounted = false;
    };
  }, [safePaymentId, safeTransactionId, safeTxRef]);

  const resolvedPaymentId = result?.paymentId || safePaymentId;

  return (
    <ResultShell
      provider="Flutterwave"
      status={verificationStatus}
      message={message}
      paymentId={resolvedPaymentId}
    >
      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <ReferenceRow label="Flutterwave Status" value={safeProviderStatus} />
        <ReferenceRow label="Transaction Reference" value={safeTxRef} />
        <ReferenceRow label="Flutterwave Transaction ID" value={safeTransactionId} />
        <ReferenceRow label="Payment Record" value={resolvedPaymentId} />
        <ReferenceRow label="Payment Reference" value={result?.paymentReference} />
        <ReferenceRow label="Transaction Reference" value={result?.transactionReference} />
      </div>
    </ResultShell>
  );
}

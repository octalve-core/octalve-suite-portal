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
  Loader2,
  ShieldCheck,
  WalletCards,
  XCircle,
} from "lucide-react";

import { api } from "@/lib/api";
import type { WalletTopUpVerifyResponse } from "@/lib/types";

type CallbackStatus = "VERIFYING" | "CONFIRMED" | "FAILED";

function cleanQueryValue(value?: string, max = 180) {
  return String(value ?? "").trim().slice(0, max);
}

function shortReference(value?: string) {
  const cleaned = cleanQueryValue(value);

  if (!cleaned) return "";

  if (cleaned.length <= 18) return cleaned;

  return `${cleaned.slice(0, 10)}...${cleaned.slice(-6)}`;
}

function statusTone(status: CallbackStatus) {
  if (status === "CONFIRMED") {
    return {
      hero: "from-emerald-700 via-emerald-600 to-[#0064E0]",
      iconWrap: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      panel: "border-emerald-200 bg-emerald-50 text-emerald-800",
      label: "Verified",
    };
  }

  if (status === "FAILED") {
    return {
      hero: "from-red-700 via-red-600 to-slate-950",
      iconWrap: "bg-red-50 text-red-700 ring-red-100",
      panel: "border-red-200 bg-red-50 text-red-800",
      label: "Needs attention",
    };
  }

  return {
    hero: "from-slate-950 via-[#003C9A] to-[#0064E0]",
    iconWrap: "bg-blue-50 text-[#0064E0] ring-blue-100",
    panel: "border-blue-200 bg-blue-50 text-blue-900",
    label: "Verifying",
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
      // Clipboard access can fail in some browsers. Display remains enough for support.
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
}: {
  provider: string;
  status: CallbackStatus;
  message: string;
  children?: ReactNode;
}) {
  const tone = statusTone(status);
  const confirmed = status === "CONFIRMED";
  const failed = status === "FAILED";

  return (
    <main className="mx-auto w-full max-w-[980px] px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/client/wallet"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[#0064E0]"
      >
        <ArrowLeft size={17} />
        Back to Wallet
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
              {provider} Wallet Funding
            </span>

            <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-white text-[#0064E0] shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                <StatusIcon status={status} />
              </span>

              <div className="min-w-0">
                <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.065em] sm:text-[44px]">
                  {confirmed
                    ? "Wallet funding confirmed"
                    : failed
                      ? "Funding not confirmed"
                      : "Verifying wallet funding"}
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
                    ? "Your wallet balance is updated only through the server-side ledger after provider verification."
                    : failed
                      ? "If your bank account was debited, do not retry repeatedly. Keep your reference and contact support."
                      : `Octalve is confirming this wallet funding with ${provider} through the secure server endpoint.`}
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
                  Secure wallet verification
                </strong>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                  This page does not credit wallet funds directly, does not trust URL amounts, and does not save payment references in browser storage. Confirmation is handled by the backend verification route.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/client/wallet"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-5 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(0,100,224,0.22)] transition hover:bg-[#0052B8]"
            >
              <WalletCards size={17} />
              Open Wallet
            </Link>

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

export function PaystackWalletTopUpCallbackPage({
  reference,
  topUpId,
}: {
  reference?: string;
  topUpId?: string;
}) {
  const verifyStartedRef = useRef(false);
  const safeReference = cleanQueryValue(reference, 160);
  const safeTopUpId = cleanQueryValue(topUpId, 160);

  const [result, setResult] = useState<WalletTopUpVerifyResponse | null>(null);
  const [status, setStatus] = useState<CallbackStatus>("VERIFYING");
  const [message, setMessage] = useState("Confirming your Paystack wallet funding securely...");

  useEffect(() => {
    if (verifyStartedRef.current) return;

    verifyStartedRef.current = true;
    let mounted = true;

    async function verifyTopUp() {
      if (!safeReference) {
        setStatus("FAILED");
        setMessage(
          "Paystack did not return a funding reference to this page. If your account was debited, contact support with your bank debit notification and wallet funding record.",
        );
        return;
      }

      try {
        const response = await api.wallet.verifyPaystackTopUp({
          reference: safeReference,
          topUpId: safeTopUpId || undefined,
        });

        if (!mounted) return;

        setResult(response);

        if (response.status === "CONFIRMED" || response.status === "ALREADY_CONFIRMED") {
          setStatus("CONFIRMED");
          setMessage(response.message);
          return;
        }

        setStatus("FAILED");
        setMessage(response.message || "Wallet funding could not be confirmed at this time.");
      } catch (error) {
        if (!mounted) return;

        setStatus("FAILED");
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to confirm wallet funding at this time. Please contact support if your account was debited.",
        );
      }
    }

    void verifyTopUp();

    return () => {
      mounted = false;
    };
  }, [safeReference, safeTopUpId]);

  return (
    <ResultShell provider="Paystack" status={status} message={message}>
      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <ReferenceRow label="Paystack Reference" value={safeReference} />
        <ReferenceRow label="Wallet Funding Record" value={safeTopUpId} />
        <ReferenceRow label="Ledger Reference" value={result?.topUpReference} />
      </div>
    </ResultShell>
  );
}

export function FlutterwaveWalletTopUpCallbackPage({
  providerStatus,
  txRef,
  transactionId,
  topUpId,
}: {
  providerStatus?: string;
  txRef?: string;
  transactionId?: string;
  topUpId?: string;
}) {
  const verifyStartedRef = useRef(false);
  const safeProviderStatus = cleanQueryValue(providerStatus, 80);
  const safeTxRef = cleanQueryValue(txRef, 160);
  const safeTransactionId = cleanQueryValue(transactionId, 80);
  const safeTopUpId = cleanQueryValue(topUpId, 160);

  const [result, setResult] = useState<WalletTopUpVerifyResponse | null>(null);
  const [status, setStatus] = useState<CallbackStatus>("VERIFYING");
  const [message, setMessage] = useState("Confirming your Flutterwave wallet funding securely...");

  useEffect(() => {
    if (verifyStartedRef.current) return;

    verifyStartedRef.current = true;
    let mounted = true;

    async function verifyTopUp() {
      if (!safeTxRef && !safeTransactionId && !safeTopUpId) {
        setStatus("FAILED");
        setMessage(
          "Flutterwave did not return a funding reference to this page. If your account was debited, contact support with your debit notification.",
        );
        return;
      }

      try {
        const response = await api.wallet.verifyFlutterwaveTopUp({
          txRef: safeTxRef || undefined,
          transactionId: safeTransactionId || undefined,
          topUpId: safeTopUpId || undefined,
        });

        if (!mounted) return;

        setResult(response);

        if (response.status === "CONFIRMED" || response.status === "ALREADY_CONFIRMED") {
          setStatus("CONFIRMED");
          setMessage(response.message);
          return;
        }

        setStatus("FAILED");
        setMessage(response.message || "Wallet funding could not be confirmed at this time.");
      } catch (error) {
        if (!mounted) return;

        setStatus("FAILED");
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to confirm wallet funding at this time. Please contact support if your account was debited.",
        );
      }
    }

    void verifyTopUp();

    return () => {
      mounted = false;
    };
  }, [safeTopUpId, safeTransactionId, safeTxRef]);

  return (
    <ResultShell provider="Flutterwave" status={status} message={message}>
      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <ReferenceRow label="Flutterwave Status" value={safeProviderStatus} />
        <ReferenceRow label="Funding Reference" value={safeTxRef} />
        <ReferenceRow label="Flutterwave Transaction ID" value={safeTransactionId} />
        <ReferenceRow label="Wallet Funding Record" value={safeTopUpId} />
        <ReferenceRow label="Ledger Reference" value={result?.topUpReference} />
      </div>
    </ResultShell>
  );
}
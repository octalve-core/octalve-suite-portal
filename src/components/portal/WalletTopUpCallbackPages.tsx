"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  WalletCards,
  XCircle,
} from "lucide-react";

import { api } from "@/lib/api";
import type { WalletTopUpVerifyResponse } from "@/lib/types";
import { Badge, Button, Card } from "./UI";

function ResultShell({
  provider,
  status,
  message,
  children,
}: {
  provider: string;
  status: "VERIFYING" | "CONFIRMED" | "FAILED";
  message: string;
  children?: React.ReactNode;
}) {
  const confirmed = status === "CONFIRMED";
  const failed = status === "FAILED";

  return (
    <div className="mx-auto w-full max-w-250 px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/client/wallet"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0064E0]"
      >
        <ArrowLeft size={17} />
        Back to Wallet
      </Link>

      <Card className="mt-6 overflow-hidden border-slate-200 bg-white p-0 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div
          className={[
            "p-6 text-white sm:p-8",
            confirmed ? "bg-emerald-700" : failed ? "bg-red-700" : "bg-slate-950",
          ].join(" ")}
        >
          <Badge className="border-white/20 bg-white/10 text-white">
            {provider} Wallet Funding
          </Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
            {confirmed
              ? "Wallet funded"
              : failed
                ? "Funding not confirmed"
                : "Verifying funding"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/75">
            {message}
          </p>
        </div>

        <div className="grid gap-5 p-6 sm:p-8">
          <div
            className={[
              "rounded-2xl border p-4",
              confirmed
                ? "border-emerald-200 bg-emerald-50"
                : failed
                  ? "border-red-200 bg-red-50"
                  : "border-blue-100 bg-blue-50",
            ].join(" ")}
          >
            <div className="flex gap-3">
              {confirmed ? (
                <CheckCircle2 className="mt-0.5 text-emerald-700" size={20} />
              ) : failed ? (
                <XCircle className="mt-0.5 text-red-700" size={20} />
              ) : (
                <Loader2 className="mt-0.5 animate-spin text-[#0064E0]" size={20} />
              )}

              <div>
                <strong className="block text-sm font-bold text-slate-950">
                  {confirmed
                    ? "Wallet credit recorded"
                    : failed
                      ? "Verification needs attention"
                      : "Secure confirmation in progress"}
                </strong>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {confirmed
                    ? "Your wallet balance has been updated from the server-side ledger."
                    : failed
                      ? "Do not retry immediately if your account was debited. Contact support with your funding reference."
                      : `Please wait while Octalve securely confirms this wallet funding with ${provider}.`}
                </p>
              </div>
            </div>
          </div>

          {children}

          {!confirmed ? (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 text-orange-600" size={20} />
                <p className="text-sm font-semibold leading-6 text-orange-800">
                  Wallet funding is credited only after secure provider verification.
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Link href="/client/wallet">
              <Button>
                <WalletCards size={16} />
                Open Wallet
              </Button>
            </Link>

            <Link href="/client">
              <Button variant="secondary">Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function PaystackWalletTopUpCallbackPage({
  reference,
  topUpId,
}: {
  reference?: string;
  topUpId?: string;
}) {
  const [result, setResult] = useState<WalletTopUpVerifyResponse | null>(null);
  const [status, setStatus] = useState<"VERIFYING" | "CONFIRMED" | "FAILED">("VERIFYING");
  const [message, setMessage] = useState("Confirming your Paystack wallet funding securely...");

  useEffect(() => {
    let mounted = true;

    async function verifyTopUp() {
      if (!reference) {
        setStatus("FAILED");
        setMessage("We could not find the Paystack funding reference for this return. Please contact support if your account was debited.");
        return;
      }

      try {
        const response = await api.wallet.verifyPaystackTopUp({
          reference,
          topUpId,
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
  }, [reference, topUpId]);

  return (
    <ResultShell provider="Paystack" status={status} message={message}>
      {reference || topUpId || result?.topUpReference ? (
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
          {reference ? (
            <div>
              <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Paystack Reference
              </span>
              <strong className="mt-1 block break-all text-slate-800">{reference}</strong>
            </div>
          ) : null}

          {topUpId ? (
            <div>
              <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Wallet Funding Record
              </span>
              <strong className="mt-1 block break-all text-slate-800">{topUpId}</strong>
            </div>
          ) : null}

          {result?.topUpReference ? (
            <div>
              <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Funding Reference
              </span>
              <strong className="mt-1 block break-all text-slate-800">{result.topUpReference}</strong>
            </div>
          ) : null}
        </div>
      ) : null}
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
  const [result, setResult] = useState<WalletTopUpVerifyResponse | null>(null);
  const [status, setStatus] = useState<"VERIFYING" | "CONFIRMED" | "FAILED">("VERIFYING");
  const [message, setMessage] = useState("Confirming your Flutterwave wallet funding securely...");

  useEffect(() => {
    let mounted = true;

    async function verifyTopUp() {
      if (!txRef && !transactionId && !topUpId) {
        setStatus("FAILED");
        setMessage("We could not find the Flutterwave funding reference for this return. Please contact support if your account was debited.");
        return;
      }

      try {
        const response = await api.wallet.verifyFlutterwaveTopUp({
          txRef,
          transactionId,
          topUpId,
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
  }, [topUpId, transactionId, txRef]);

  return (
    <ResultShell provider="Flutterwave" status={status} message={message}>
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
        {providerStatus ? (
          <div>
            <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Flutterwave Status
            </span>
            <strong className="mt-1 block break-all text-slate-800">{providerStatus}</strong>
          </div>
        ) : null}

        {txRef ? (
          <div>
            <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Funding Reference
            </span>
            <strong className="mt-1 block break-all text-slate-800">{txRef}</strong>
          </div>
        ) : null}

        {transactionId ? (
          <div>
            <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Flutterwave Transaction ID
            </span>
            <strong className="mt-1 block break-all text-slate-800">{transactionId}</strong>
          </div>
        ) : null}

        {topUpId ? (
          <div>
            <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Wallet Funding Record
            </span>
            <strong className="mt-1 block break-all text-slate-800">{topUpId}</strong>
          </div>
        ) : null}

        {result?.topUpReference ? (
          <div>
            <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Ledger Reference
            </span>
            <strong className="mt-1 block break-all text-slate-800">{result.topUpReference}</strong>
          </div>
        ) : null}
      </div>
    </ResultShell>
  );
}
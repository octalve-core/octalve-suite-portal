"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  XCircle,
} from "lucide-react";

import { api } from "@/lib/api";
import type { PaymentVerifyResponse } from "@/lib/types";
import { Badge, Button, Card } from "./UI";

export function PaystackPaymentCallbackPage({
  reference,
  paymentId,
}: {
  reference?: string;
  paymentId?: string;
}) {
  const [result, setResult] = useState<PaymentVerifyResponse | null>(null);
  const [status, setStatus] = useState<"VERIFYING" | "CONFIRMED" | "FAILED">("VERIFYING");
  const [message, setMessage] = useState("Verifying your Paystack payment securely...");

  useEffect(() => {
    let mounted = true;

    async function verifyPayment() {
      if (!reference) {
        setStatus("FAILED");
        setMessage("Missing Paystack reference. Please return to payments and contact support if you were debited.");
        return;
      }

      try {
        const response = await api.payments.verifyPaystack({
          reference,
          paymentId,
        });

        if (!mounted) return;

        setResult(response);

        if (response.status === "CONFIRMED" || response.status === "ALREADY_CONFIRMED") {
          setStatus("CONFIRMED");
          setMessage(response.message);
          return;
        }

        setStatus("FAILED");
        setMessage(response.message || "Payment could not be confirmed yet.");
      } catch (error) {
        if (!mounted) return;

        setStatus("FAILED");
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to verify payment. Please contact support if you were debited.",
        );
      }
    }

    void verifyPayment();

    return () => {
      mounted = false;
    };
  }, [paymentId, reference]);

  const confirmed = status === "CONFIRMED";
  const failed = status === "FAILED";

  return (
    <div className="mx-auto w-full max-w-250 px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/client/payments"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0064E0]"
      >
        <ArrowLeft size={17} />
        Back to Payments
      </Link>

      <Card className="mt-6 overflow-hidden border-slate-200 bg-white p-0 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div
          className={[
            "p-6 text-white sm:p-8",
            confirmed ? "bg-emerald-700" : failed ? "bg-red-700" : "bg-slate-950",
          ].join(" ")}
        >
          <Badge className="border-white/20 bg-white/10 text-white">Paystack Verification</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
            {confirmed
              ? "Payment confirmed"
              : failed
                ? "Payment not confirmed"
                : "Verifying payment"}
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
                    ? "Verified by server"
                    : failed
                      ? "Verification needs attention"
                      : "Server verification in progress"}
                </strong>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {confirmed
                    ? "Your payment has been confirmed and your project access has been updated."
                    : failed
                      ? "Do not retry immediately if your account was debited. Contact support with your reference."
                      : "Please wait while Octalve confirms this payment with Paystack."}
                </p>
              </div>
            </div>
          </div>

          {reference || paymentId || result?.transactionReference ? (
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              {reference ? (
                <div>
                  <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    Paystack Reference
                  </span>
                  <strong className="mt-1 block break-all text-slate-800">{reference}</strong>
                </div>
              ) : null}

              {paymentId ? (
                <div>
                  <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    Payment ID
                  </span>
                  <strong className="mt-1 block break-all text-slate-800">{paymentId}</strong>
                </div>
              ) : null}

              {result?.transactionReference ? (
                <div>
                  <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    Internal Transaction
                  </span>
                  <strong className="mt-1 block break-all text-slate-800">
                    {result.transactionReference}
                  </strong>
                </div>
              ) : null}
            </div>
          ) : null}

          {!confirmed ? (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 text-orange-600" size={20} />
                <p className="text-sm font-semibold leading-6 text-orange-800">
                  This page only confirms payment after secure server verification. Webhook confirmation will be added next for full provider-grade reliability.
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Link href="/client/payments">
              <Button>
                <CreditCard size={16} />
                Open Payments
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
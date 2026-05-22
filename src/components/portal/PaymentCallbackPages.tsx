"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, CreditCard } from "lucide-react";

import { Badge, Button, Card } from "./UI";

export function PaystackPaymentCallbackPage({
  reference,
  paymentId,
}: {
  reference?: string;
  paymentId?: string;
}) {
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
        <div className="bg-slate-950 p-6 text-white sm:p-8">
          <Badge className="border-white/20 bg-white/10 text-white">Paystack Return</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
            Payment return received
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/70">
            Your Paystack checkout session has returned to Octalve. Final confirmation still requires secure server verification.
          </p>
        </div>

        <div className="grid gap-5 p-6 sm:p-8">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex gap-3">
              <CreditCard className="mt-0.5 text-[#0064E0]" size={20} />
              <div>
                <strong className="block text-sm font-bold text-slate-950">
                  What happens next?
                </strong>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Octalve will verify the payment securely before unlocking your project. Do not retry payment unless your payment remains unpaid after verification.
                </p>
              </div>
            </div>
          </div>

          {reference || paymentId ? (
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
            </div>
          ) : null}

          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 text-orange-600" size={20} />
              <p className="text-sm font-semibold leading-6 text-orange-800">
                This page does not confirm payment by itself. Confirmation will be handled by secure verification and webhook processing.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/client/payments">
              <Button>
                <CheckCircle2 size={16} />
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
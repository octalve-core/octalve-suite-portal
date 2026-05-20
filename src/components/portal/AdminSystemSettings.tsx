"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  Building2,
  CheckCircle2,
  Info,
  Landmark,
  Loader2,
  LockKeyhole,
  RefreshCcw,
  Save,
  ShieldCheck,
} from "lucide-react";

import { api } from "@/lib/api";
import { OCTALVE_PAYMENT_BANK } from "@/lib/payment-bank";
import { useApp } from "./AppContext";
import { Button, Card } from "./UI";

type PaymentBankForm = {
  bankName: string;
  accountName: string;
  accountNumber: string;
};

function InfoCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
          {icon}
        </span>
        <div className="min-w-0">
          <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
            {label}
          </span>
          <strong className="mt-1 block break-words text-base font-semibold text-slate-950">
            {value || "Not configured"}
          </strong>
          <p className="mt-1 text-sm leading-6 text-slate-500">{helper}</p>
        </div>
      </div>
    </div>
  );
}

export function AdminSystemSettings() {
  const { currentUser, refresh } = useApp();

  const [form, setForm] = useState<PaymentBankForm>(OCTALVE_PAYMENT_BANK);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function loadSettings() {
    setLoading(true);
    setNotice("");
    setError("");

    try {
      const bank = await api.systemSettings.paymentBank.get();
      setForm(bank);
      setConnected(true);
      setNotice("Backend system settings connected.");
      window.setTimeout(() => setNotice(""), 1800);
    } catch {
      setForm(OCTALVE_PAYMENT_BANK);
      setConnected(false);
      setError("Backend system settings are not configured yet. Current fallback bank details are shown in read-only mode.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  async function saveSettings() {
    if (!connected) return;

    setSaving(true);
    setNotice("");
    setError("");

    try {
      const updated = await api.systemSettings.paymentBank.update({
        bankName: form.bankName.trim(),
        accountName: form.accountName.trim(),
        accountNumber: form.accountNumber.trim(),
      });

      setForm(updated);
      setNotice("Payment bank settings saved and synced to open payments.");
      await refresh();
      window.setTimeout(() => setNotice(""), 2400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save payment bank settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="content">
      <section className="mb-7 rounded-[30px] bg-[#000A16] px-6 py-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:px-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white/80">
              System Configuration
            </span>
            <h1 className="mt-4 max-w-3xl text-[34px] font-semibold leading-[1.02] tracking-[-0.055em] sm:text-[46px]">
              Settings
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/75 sm:text-[15px]">
              Manage production payment details and workspace configuration from one admin page.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm">
            <span className="block text-white/55">Signed in as</span>
            <strong className="mt-1 block text-white">{currentUser?.name ?? "Admin"}</strong>
            <span className="mt-1 block text-white/60">{currentUser?.email ?? "No email"}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Card className="border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.16em] text-[#0064E0]">
                Payment Source
              </span>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em] text-slate-950">
                Bank Transfer Details
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Once the backend system settings endpoint is available, these details can be edited here and used for payment instructions.
              </p>
            </div>

            <span
              className={[
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold",
                connected
                  ? "border-emerald-200 bg-emerald-50 text-[#29BE3E]"
                  : "border-orange-200 bg-orange-50 text-[#FC7E24]",
              ].join(" ")}
            >
              {connected ? <ShieldCheck size={14} /> : <LockKeyhole size={14} />}
              {connected ? "Backend connected" : "Read-only fallback"}
            </span>
          </div>

          {loading ? (
            <div className="grid min-h-[230px] place-items-center">
              <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-500">
                <Loader2 size={18} className="animate-spin" />
                Checking system settings...
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-800">Bank Name</span>
                <div className="relative">
                  <Landmark className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    value={form.bankName}
                    onChange={(event) => setForm((value) => ({ ...value, bankName: event.target.value }))}
                    disabled={!connected || saving}
                    placeholder="PROVIDUS BANK"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-800">Account Name</span>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    value={form.accountName}
                    onChange={(event) => setForm((value) => ({ ...value, accountName: event.target.value }))}
                    disabled={!connected || saving}
                    placeholder="OCTALVE LTD"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-800">Account Number</span>
                <div className="relative">
                  <Banknote className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    value={form.accountNumber}
                    onChange={(event) => setForm((value) => ({ ...value, accountNumber: event.target.value }))}
                    disabled={!connected || saving}
                    placeholder="1308342612"
                    inputMode="numeric"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </label>

              {notice ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  {notice}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                <Button variant="secondary" onClick={loadSettings} disabled={saving}>
                  <RefreshCcw size={16} />
                  Recheck Backend
                </Button>

                <Button
                  onClick={saveSettings}
                  loading={saving}
                  disabled={!connected || loading}
                  className="bg-[#0064E0]"
                >
                  <Save size={16} />
                  Save Payment Settings
                </Button>
              </div>
            </div>
          )}
        </Card>

        <div className="grid gap-4">
          <InfoCard
            icon={<Landmark size={20} />}
            label="Current bank"
            value={form.bankName}
            helper="Shown from backend settings when available, otherwise from env fallback."
          />

          <InfoCard
            icon={<Building2 size={20} />}
            label="Current account"
            value={form.accountName}
            helper="The receiving account name clients should see."
          />

          <InfoCard
            icon={<Banknote size={20} />}
            label="Current number"
            value={form.accountNumber}
            helper="Clients can copy this from payment pages."
          />

          <div className="rounded-[24px] border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 text-[#0064E0]" size={20} />
              <div>
                <strong className="block text-sm font-bold text-blue-900">
                  Backend-ready setup
                </strong>
                <p className="mt-1 text-sm leading-6 text-blue-800">
                  This page will become editable automatically after the backend adds the system settings endpoint and database model.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 text-[#29BE3E]" size={20} />
              <div>
                <strong className="block text-sm font-bold text-emerald-800">
                  Safe for current deployment
                </strong>
                <p className="mt-1 text-sm leading-6 text-emerald-700">
                  No Prisma migration is required from this frontend-only update.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
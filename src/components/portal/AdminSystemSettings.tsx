"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  Globe2,
  Info,
  Landmark,
  Loader2,
  LockKeyhole,
  RefreshCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

import { api } from "@/lib/api";
import type { PaymentBankDetails, PaymentGatewaySetting } from "@/lib/types";
import { useApp } from "./AppContext";
import { Badge, Button, Card, Select } from "./UI";

type PaymentBankForm = PaymentBankDetails;

const EMPTY_BANK_FORM: PaymentBankForm = {
  bankName: "",
  accountName: "",
  accountNumber: "",
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
            {value || "Not set"}
          </strong>
          <p className="mt-1 text-sm leading-6 text-slate-500">{helper}</p>
        </div>
      </div>
    </div>
  );
}

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === "MANUAL_BANK") return <Landmark size={20} />;
  if (provider === "PAYSTACK") return <CreditCard size={20} />;
  if (provider === "FLUTTERWAVE") return <Globe2 size={20} />;
  if (provider === "PAYPAL") return <Globe2 size={20} />;
  return <SlidersHorizontal size={20} />;
}

function envBadge(configured?: boolean, label = "Env") {
  return (
    <Badge className={configured ? "badge-green" : "badge-orange"}>
      {label}: {configured ? "Configured" : "Missing"}
    </Badge>
  );
}

function GatewayCard({
  gateway,
  saving,
  onUpdate,
}: {
  gateway: PaymentGatewaySetting;
  saving: boolean;
  onUpdate: (
    provider: string,
    data: { isEnabled?: boolean; mode?: "LIVE" | "TEST"; notes?: string },
  ) => Promise<void>;
}) {
  const isManualOrWallet =
    gateway.provider === "MANUAL_BANK" || gateway.provider === "WALLET";

  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-50 text-[#0064E0] ring-1 ring-slate-200">
            <ProviderIcon provider={gateway.provider} />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold tracking-[-0.035em] text-slate-950">
                {gateway.displayName}
              </h3>
              <Badge className={gateway.isEnabled ? "badge-green" : "badge-slate"}>
                {gateway.isEnabled ? "Enabled" : "Disabled"}
              </Badge>
              <Badge className={gateway.mode === "LIVE" ? "badge-blue" : "badge-orange"}>
                {gateway.mode}
              </Badge>
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {gateway.notes || "No operational note provided."}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {gateway.publicKeyEnvName ? envBadge(gateway.publicKeyConfigured, "Public key") : null}
              {gateway.secretKeyEnvName ? envBadge(gateway.secretKeyConfigured, "Secret key") : null}
              {gateway.webhookSecretEnvName ? envBadge(gateway.webhookSecretConfigured, "Webhook") : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={gateway.mode as "LIVE" | "TEST"}
            disabled={saving || isManualOrWallet}
            onChange={(event) =>
              onUpdate(gateway.provider, {
                mode: event.target.value as "LIVE" | "TEST",
              })
            }
            className="h-10 min-w-[110px] rounded-2xl border-slate-200 text-sm"
          >
            <option value="LIVE">LIVE</option>
            <option value="TEST">TEST</option>
          </Select>

          <Button
            variant={gateway.isEnabled ? "secondary" : "primary"}
            disabled={saving}
            onClick={() =>
              onUpdate(gateway.provider, {
                isEnabled: !gateway.isEnabled,
              })
            }
          >
            {gateway.isEnabled ? "Disable" : "Enable"}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm sm:grid-cols-2">
        <div>
          <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Callback
          </span>
          <strong className="mt-1 block break-all text-slate-800">
            {gateway.callbackPath || "Not applicable"}
          </strong>
        </div>

        <div>
          <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Webhook
          </span>
          <strong className="mt-1 block break-all text-slate-800">
            {gateway.webhookPath || "Not applicable"}
          </strong>
        </div>

        <div className="sm:col-span-2">
          <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Server env references
          </span>
          <p className="mt-1 break-words text-slate-600">
            {[gateway.publicKeyEnvName, gateway.secretKeyEnvName, gateway.webhookSecretEnvName]
              .filter(Boolean)
              .join(" • ") || "No credential reference required."}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AdminSystemSettings() {
  const { refresh } = useApp();

  const [form, setForm] = useState<PaymentBankForm>(EMPTY_BANK_FORM);
  const [gateways, setGateways] = useState<PaymentGatewaySetting[]>([]);
  const [connected, setConnected] = useState(false);
  const [gatewayConnected, setGatewayConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingBank, setSavingBank] = useState(false);
  const [savingGateway, setSavingGateway] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const enabledGatewayCount = useMemo(
    () => gateways.filter((gateway) => gateway.isEnabled).length,
    [gateways],
  );

  async function loadSettings() {
    setLoading(true);
    setNotice("");
    setError("");

    try {
      const [bank, gatewayList] = await Promise.all([
        api.systemSettings.paymentBank.get(),
        api.systemSettings.paymentGateways.list(),
      ]);

      setForm(bank);
      setGateways(gatewayList);
      setConnected(true);
      setGatewayConnected(true);
      setNotice("Payment settings are up to date.");
      window.setTimeout(() => setNotice(""), 1800);
    } catch (err) {
      setConnected(false);
      setGatewayConnected(false);
      setError(err instanceof Error ? err.message : "Unable to load payment settings. Please refresh or contact system support.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  async function saveBankSettings() {
    setSavingBank(true);
    setNotice("");
    setError("");

    try {
      const updated = await api.systemSettings.paymentBank.update({
        bankName: form.bankName.trim(),
        accountName: form.accountName.trim(),
        accountNumber: form.accountNumber.trim(),
      });

      setForm(updated);
      setConnected(true);
      setNotice("Bank transfer details saved successfully.");
      await refresh();
      window.setTimeout(() => setNotice(""), 2400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save payment bank settings.");
    } finally {
      setSavingBank(false);
    }
  }

  async function updateGateway(
    provider: string,
    data: { isEnabled?: boolean; mode?: "LIVE" | "TEST"; notes?: string },
  ) {
    setSavingGateway(provider);
    setNotice("");
    setError("");

    try {
      const updated = await api.systemSettings.paymentGateways.update({
        provider,
        ...data,
      });

      setGateways(updated);
      setGatewayConnected(true);
      setNotice("Gateway settings updated. Sensitive credentials remain protected in server environment variables.");
      window.setTimeout(() => setNotice(""), 2400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update gateway settings.");
    } finally {
      setSavingGateway("");
    }
  }

  return (
    <div className="content">
      <section className="mb-7 rounded-[30px] bg-[#000A16] px-6 py-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:px-8 lg:px-10">
        <div>
          <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white/80">
            Payment Operations
          </span>
          <h1 className="mt-4 max-w-3xl text-[34px] font-semibold leading-[1.02] tracking-[-0.055em] sm:text-[46px]">
            Settings
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/75 sm:text-[15px]">
            Manage bank transfer details, online payment channels and operational payment controls.
          </p>
        </div>
      </section>

      {notice ? (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <Card className="grid min-h-[300px] place-items-center border-slate-200 bg-white p-8">
          <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-500">
            <Loader2 size={18} className="animate-spin" />
            Loading payment settings...
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <Card className="border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-[#0064E0]">
                    Manual Bank Transfer
                  </span>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em] text-slate-950">
                    Bank Transfer Details
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    These details are public payment instructions shown to clients for manual bank transfer.
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
                  {connected ? "Settings synced" : "Settings unavailable"}
                </span>
              </div>

              <div className="mt-6 grid gap-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-800">Bank Name</span>
                  <div className="relative">
                    <Landmark className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <input
                      value={form.bankName}
                      onChange={(event) => setForm((value) => ({ ...value, bankName: event.target.value }))}
                      disabled={savingBank}
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
                      disabled={savingBank}
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
                      disabled={savingBank}
                      placeholder="1308342612"
                      inputMode="numeric"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </label>

                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                  <Button variant="secondary" onClick={loadSettings} disabled={savingBank}>
                    <RefreshCcw size={16} />
                    Refresh Settings
                  </Button>

                  <Button
                    onClick={saveBankSettings}
                    loading={savingBank}
                    disabled={loading}
                    className="bg-[#0064E0]"
                  >
                    <Save size={16} />
                    Save Bank Details
                  </Button>
                </div>
              </div>
            </Card>

            <div className="grid gap-4">
              <InfoCard
                icon={<Landmark size={20} />}
                label="Current bank"
                value={form.bankName}
                helper="Active receiving bank displayed on client payment pages."
              />

              <InfoCard
                icon={<Building2 size={20} />}
                label="Current account"
                value={form.accountName}
                helper="Active receiving account name shown to clients."
              />

              <InfoCard
                icon={<Banknote size={20} />}
                label="Current number"
                value={form.accountNumber}
                helper="Active receiving account number shown to clients."
              />

              <div className="rounded-[24px] border border-blue-200 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 text-[#0064E0]" size={20} />
                  <div>
                    <strong className="block text-sm font-bold text-blue-900">
                      Manual transfer notice
                    </strong>
                    <p className="mt-1 text-sm leading-6 text-blue-800">
                      Bank details are visible to clients as payment instructions. Gateway credentials remain protected in server environment variables.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Card className="border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.16em] text-[#0064E0]">
                  Gateway Control
                </span>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em] text-slate-950">
                  Payment Gateways
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  Enable or disable approved payment channels. Credential values are never displayed in the portal.
                </p>
              </div>

              <span
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold",
                  gatewayConnected
                    ? "border-emerald-200 bg-emerald-50 text-[#29BE3E]"
                    : "border-orange-200 bg-orange-50 text-[#FC7E24]",
                ].join(" ")}
              >
                {gatewayConnected ? <CheckCircle2 size={14} /> : <LockKeyhole size={14} />}
                {enabledGatewayCount} Enabled
              </span>
            </div>

            <div className="mt-6 grid gap-4">
              {gateways.map((gateway) => (
                <GatewayCard
                  key={gateway.provider}
                  gateway={gateway}
                  saving={savingGateway === gateway.provider}
                  onUpdate={updateGateway}
                />
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
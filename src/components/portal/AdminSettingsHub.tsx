"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  CreditCard,
  FileText,
  Globe2,
  Headphones,
  Languages,
  Loader2,
  LockKeyhole,
  Mail,
  RefreshCcw,
  Save,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  ToggleLeft,
  UserRoundCog,
} from "lucide-react";

import { api } from "@/lib/api";
import type {
  NotificationDefaultSetting,
  SupportSetting,
  WorkspaceDefaultSetting,
} from "@/lib/types";
import { AdminSystemSettings } from "./AdminSystemSettings";
import { AdminEmailTemplateSettings } from "./AdminEmailTemplateSettings";
import { ProfileSettings } from "./ProfileSettings";

type AdminSettingsTab =
  | "profile"
  | "payments"
  | "notifications"
  | "support"
  | "workspace"
  | "security";

type ControlState = "active" | "ready" | "planned" | "schema";

type AdminSettingsTabItem = {
  id: AdminSettingsTab;
  label: string;
  description: string;
  icon: ReactNode;
  state: ControlState;
};

type PlannedControl = {
  title: string;
  description: string;
  state: ControlState;
  icon: ReactNode;
};

const tabs: AdminSettingsTabItem[] = [
  {
    id: "profile",
    label: "Profile & Security",
    description: "Admin identity, contact details and password access.",
    icon: <UserRoundCog size={18} strokeWidth={2.2} />,
    state: "active",
  },
  {
    id: "payments",
    label: "Payment Controls",
    description: "Bank transfer details, gateway availability and provider readiness.",
    icon: <CreditCard size={18} strokeWidth={2.2} />,
    state: "active",
  },
  {
    id: "notifications",
    label: "Notification Controls",
    description: "Manage default in-app and email notification behavior.",
    icon: <Bell size={18} strokeWidth={2.2} />,
    state: "active",
  },
  {
    id: "support",
    label: "Support Controls",
    description: "Manage support email, guide URL and client support policy.",
    icon: <Headphones size={18} strokeWidth={2.2} />,
    state: "active",
  },
  {
    id: "workspace",
    label: "Workspace Defaults",
    description: "Manage timezone, language, digest and default preferences.",
    icon: <SlidersHorizontal size={18} strokeWidth={2.2} />,
    state: "active",
  },
  {
    id: "security",
    label: "Security Policies",
    description: "2FA, sessions and password policy visibility for the workspace.",
    icon: <ShieldCheck size={18} strokeWidth={2.2} />,
    state: "planned",
  },
];

const stateLabels: Record<ControlState, string> = {
  active: "Active",
  ready: "Ready",
  planned: "Planned",
  schema: "Needs schema",
};

const stateClasses: Record<ControlState, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ready: "border-blue-200 bg-blue-50 text-[#0064E0]",
  planned: "border-slate-200 bg-slate-50 text-slate-600",
  schema: "border-orange-200 bg-orange-50 text-orange-700",
};

function statusPill(state: ControlState) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em]",
        stateClasses[state],
      ].join(" ")}
    >
      {stateLabels[state]}
    </span>
  );
}

function tabButtonClass(active: boolean) {
  return [
    "flex min-w-[230px] flex-1 items-start gap-3 rounded-2xl border px-4 py-4 text-left transition",
    active
      ? "border-[#0064E0] bg-blue-50 text-slate-950 shadow-[0_12px_30px_rgba(0,100,224,0.12)]"
      : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50",
  ].join(" ");
}

function AdminSettingsHeader({
  activeTab,
  onSelect,
}: {
  activeTab: AdminSettingsTab;
  onSelect: (tab: AdminSettingsTab) => void;
}) {
  return (
    <section className="content">
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
              <Settings2 size={20} strokeWidth={2.2} />
            </span>

            <div>
              <span className="text-xs font-black uppercase tracking-[0.16em] text-[#0064E0]">
                Admin Settings
              </span>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.045em] text-slate-950">
                Workspace Control Center
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                Manage live-backed settings and keep security-sensitive controls separated from cosmetic UI.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold leading-6 text-blue-900">
            Payment, notification, support and workspace defaults are now controlled from admin.
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-3">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                className={tabButtonClass(active)}
                onClick={() => onSelect(tab.id)}
                aria-pressed={active}
              >
                <span
                  className={[
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                    active ? "bg-[#0064E0] text-white" : "bg-slate-100 text-slate-500",
                  ].join(" ")}
                >
                  {tab.icon}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <strong className="block text-sm font-bold">{tab.label}</strong>
                    {statusPill(tab.state)}
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-slate-500">
                    {tab.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PanelShell({
  eyebrow,
  title,
  description,
  icon,
  children,
  side,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
  side: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.055)]">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="p-6 sm:p-8">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-[#0064E0]">
              {eyebrow}
            </span>
            <h2 className="mt-3 text-[32px] font-semibold leading-tight tracking-[-0.06em] text-slate-950 sm:text-[42px]">
              {title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-500">
              {description}
            </p>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-6 sm:p-8 lg:border-l lg:border-t-0">
            <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-[#0064E0] ring-1 ring-slate-200">
                {icon}
              </span>

              <div>{side}</div>
            </div>
          </div>
        </div>
      </section>

      {children}
    </main>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="mt-5 grid min-h-72 place-items-center rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_18px_45px_rgba(15,23,42,0.055)]">
      <div className="inline-flex items-center gap-3 text-sm font-bold text-slate-500">
        <Loader2 size={18} className="animate-spin" />
        {label}
      </div>
    </div>
  );
}

function AlertMessage({
  type,
  children,
}: {
  type: "success" | "error" | "info";
  children: ReactNode;
}) {
  const classes = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    error: "border-red-200 bg-red-50 text-red-700",
    info: "border-blue-100 bg-blue-50 text-blue-900",
  };

  return (
    <div className={["mt-5 rounded-2xl border px-4 py-3 text-sm font-bold", classes[type]].join(" ")}>
      {children}
    </div>
  );
}

function SettingsInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function SettingsTextarea({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-950 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function SettingsSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
      >
        {children}
      </select>
    </label>
  );
}

function SwitchControl({
  title,
  description,
  checked,
  onChange,
  disabled,
  icon,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-slate-100 py-4 last:border-b-0">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-50 text-[#0064E0] ring-1 ring-slate-200">
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <strong className="block text-sm font-semibold text-slate-950">
          {title}
        </strong>
        <span className="mt-1 block text-sm font-medium leading-5 text-slate-500">
          {description}
        </span>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "relative h-8 w-14 shrink-0 rounded-full border transition disabled:cursor-not-allowed disabled:opacity-60",
          checked ? "border-blue-200 bg-[#0064E0]" : "border-slate-200 bg-slate-200",
        ].join(" ")}
        aria-pressed={checked}
      >
        <span
          className={[
            "absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition",
            checked ? "left-7" : "left-1",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

function SaveBar({
  onRefresh,
  onSave,
  saving,
  refreshing,
}: {
  onRefresh: () => void;
  onSave: () => void;
  saving: boolean;
  refreshing: boolean;
}) {
  return (
    <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
      <button
        type="button"
        onClick={onRefresh}
        disabled={saving || refreshing}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0064E0] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <RefreshCcw size={16} className={refreshing ? "animate-spin" : ""} />
        Refresh
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={saving || refreshing}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(0,100,224,0.18)] transition hover:bg-[#0052B8] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Save size={16} />
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

function SupportControlsPanel() {
  const [form, setForm] = useState<SupportSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function load(mode: "initial" | "refresh" = "initial") {
    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);

    setError("");
    setNotice("");

    try {
      const data = await api.systemSettings.support.get();
      setForm(data);
      if (mode === "refresh") setNotice("Support controls refreshed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load support controls.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load("initial");
  }, []);

  async function save() {
    if (!form) return;

    setSaving(true);
    setNotice("");
    setError("");

    try {
      const saved = await api.systemSettings.support.update({
        supportEmail: form.supportEmail,
        guideUrl: form.guideUrl,
        preferPhaseThreadSupport: form.preferPhaseThreadSupport,
        paymentDisputeSafetyText: form.paymentDisputeSafetyText,
      });

      setForm(saved);
      setNotice("Support controls saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save support controls.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PanelShell
      eyebrow="Support Controls"
      title="Support policy control center"
      description="Control the support email, guide URL, phase-thread preference and payment dispute safety text used across support flows."
      icon={<Headphones size={24} />}
      side={
        <>
          <h3 className="text-lg font-semibold tracking-[-0.035em] text-slate-950">
            Admin-managed support
          </h3>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            These values are stored server-side and can be reused by client-facing support screens.
          </p>
        </>
      }
    >
      {loading ? <LoadingPanel label="Loading support controls..." /> : null}

      {!loading && error ? <AlertMessage type="error">{error}</AlertMessage> : null}
      {!loading && notice ? <AlertMessage type="success">{notice}</AlertMessage> : null}

      {!loading && form ? (
        <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.055)] sm:p-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <SettingsInput
              label="Support Email"
              value={form.supportEmail}
              onChange={(value) => setForm({ ...form, supportEmail: value })}
              placeholder="info@octalve.com"
              type="email"
            />

            <SettingsInput
              label="Guide URL"
              value={form.guideUrl}
              onChange={(value) => setForm({ ...form, guideUrl: value })}
              placeholder="https://octalve.com/trends"
            />
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 p-4">
            <SwitchControl
              title="Prefer phase-thread support"
              description="Push clients toward project-linked phase conversations when a phase exists."
              checked={form.preferPhaseThreadSupport}
              onChange={(value) => setForm({ ...form, preferPhaseThreadSupport: value })}
              icon={<Headphones size={18} />}
            />
          </div>

          <div className="mt-5">
            <SettingsTextarea
              label="Payment Dispute Safety Text"
              value={form.paymentDisputeSafetyText}
              onChange={(value) => setForm({ ...form, paymentDisputeSafetyText: value })}
            />
          </div>

          <SaveBar
            onRefresh={() => load("refresh")}
            onSave={save}
            saving={saving}
            refreshing={refreshing}
          />
        </section>
      ) : null}
    </PanelShell>
  );
}

function WorkspaceDefaultsPanel() {
  const [form, setForm] = useState<WorkspaceDefaultSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function load(mode: "initial" | "refresh" = "initial") {
    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);

    setError("");
    setNotice("");

    try {
      const data = await api.systemSettings.workspaceDefaults.get();
      setForm(data);
      if (mode === "refresh") setNotice("Workspace defaults refreshed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load workspace defaults.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load("initial");
  }, []);

  async function save() {
    if (!form) return;

    setSaving(true);
    setNotice("");
    setError("");

    try {
      const saved = await api.systemSettings.workspaceDefaults.update({
        defaultTimezone: form.defaultTimezone,
        defaultLanguage: form.defaultLanguage,
        updateFrequency: form.updateFrequency,
        emailDigest: form.emailDigest,
        allowClientPreferenceOverride: form.allowClientPreferenceOverride,
      });

      setForm(saved);
      setNotice("Workspace defaults saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save workspace defaults.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PanelShell
      eyebrow="Workspace Defaults"
      title="Default workspace preferences"
      description="Control timezone, language, digest behavior and whether clients can override workspace defaults."
      icon={<SlidersHorizontal size={24} />}
      side={
        <>
          <h3 className="text-lg font-semibold tracking-[-0.035em] text-slate-950">
            Default behavior
          </h3>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            These values become the admin source of truth for client and staff preference screens.
          </p>
        </>
      }
    >
      {loading ? <LoadingPanel label="Loading workspace defaults..." /> : null}

      {!loading && error ? <AlertMessage type="error">{error}</AlertMessage> : null}
      {!loading && notice ? <AlertMessage type="success">{notice}</AlertMessage> : null}

      {!loading && form ? (
        <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.055)] sm:p-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <SettingsSelect
              label="Default Timezone"
              value={form.defaultTimezone}
              onChange={(value) => setForm({ ...form, defaultTimezone: value })}
            >
              <option value="Africa/Lagos">Africa/Lagos - West Africa Time</option>
              <option value="UTC">UTC</option>
            </SettingsSelect>

            <SettingsSelect
              label="Default Language"
              value={form.defaultLanguage}
              onChange={(value) => setForm({ ...form, defaultLanguage: value })}
            >
              <option value="English (US)">English (US)</option>
              <option value="English (UK)">English (UK)</option>
            </SettingsSelect>

            <SettingsSelect
              label="Update Frequency"
              value={form.updateFrequency}
              onChange={(value) => setForm({ ...form, updateFrequency: value })}
            >
              <option value="REAL_TIME">Real-time</option>
              <option value="DAILY_DIGEST">Daily Digest</option>
              <option value="WEEKLY_DIGEST">Weekly Digest</option>
              <option value="IMPORTANT_ONLY">Important Only</option>
            </SettingsSelect>

            <SettingsSelect
              label="Email Digest"
              value={form.emailDigest}
              onChange={(value) => setForm({ ...form, emailDigest: value })}
            >
              <option value="SUMMARY_OF_ALL_ACTIVITY">Summary of all activity</option>
              <option value="PAYMENTS_AND_APPROVALS">Payments and approvals</option>
              <option value="PROJECT_ACTIVITY_ONLY">Project activity only</option>
              <option value="NONE">None</option>
            </SettingsSelect>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 p-4">
            <SwitchControl
              title="Allow client preference override"
              description="Allow clients to override admin-managed defaults when preference screens are fully enabled."
              checked={form.allowClientPreferenceOverride}
              onChange={(value) =>
                setForm({ ...form, allowClientPreferenceOverride: value })
              }
              icon={<ToggleLeft size={18} />}
            />
          </div>

          <SaveBar
            onRefresh={() => load("refresh")}
            onSave={save}
            saving={saving}
            refreshing={refreshing}
          />
        </section>
      ) : null}
    </PanelShell>
  );
}

function NotificationControlsPanel() {
  const [form, setForm] = useState<NotificationDefaultSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function load(mode: "initial" | "refresh" = "initial") {
    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);

    setError("");
    setNotice("");

    try {
      const data = await api.systemSettings.notificationDefaults.get();
      setForm(data);
      if (mode === "refresh") setNotice("Notification controls refreshed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load notification controls.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load("initial");
  }, []);

  async function save() {
    if (!form) return;

    setSaving(true);
    setNotice("");
    setError("");

    try {
      const saved = await api.systemSettings.notificationDefaults.update({
        inAppAlertsEnabled: form.inAppAlertsEnabled,
        emailAlertsEnabled: form.emailAlertsEnabled,
        paymentUpdatesEnabled: form.paymentUpdatesEnabled,
        approvalNotificationsEnabled: form.approvalNotificationsEnabled,
        projectUpdatesEnabled: form.projectUpdatesEnabled,
        supportMessagesEnabled: form.supportMessagesEnabled,
        emailProvider: form.emailProvider,
      });

      setForm(saved);
      setNotice("Notification controls saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save notification controls.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PanelShell
      eyebrow="Notification Controls"
      title="Default alert and email notification controls"
      description="Manage in-app notification defaults and prepare email notification behavior without exposing provider secrets."
      icon={<Bell size={24} />}
      side={
        <>
          <h3 className="text-lg font-semibold tracking-[-0.035em] text-slate-950">
            Email provider safety
          </h3>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            Provider keys stay in Vercel environment variables. This screen stores provider selection and notification defaults only.
          </p>
        </>
      }
    >
      {loading ? <LoadingPanel label="Loading notification controls..." /> : null}

      {!loading && error ? <AlertMessage type="error">{error}</AlertMessage> : null}
      {!loading && notice ? <AlertMessage type="success">{notice}</AlertMessage> : null}

      {!loading && form ? (
        <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.055)] sm:p-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <SettingsSelect
              label="Email Provider"
              value={form.emailProvider}
              onChange={(value) =>
                setForm({
                  ...form,
                  emailProvider: value,
                  emailAlertsEnabled:
                    value === "NONE" ? false : form.emailAlertsEnabled,
                })
              }
            >
              <option value="NONE">None</option>
              <option value="RESEND">Resend</option>
              <option value="BREVO">Brevo</option>
              <option value="SMTP">SMTP</option>
            </SettingsSelect>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold leading-6 text-blue-900">
              Email alerts require a provider. Secret keys are never saved or shown in this interface.
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 p-4">
            <SwitchControl
              title="In-app alerts"
              description="Enable notification records inside the workspace."
              checked={form.inAppAlertsEnabled}
              onChange={(value) => setForm({ ...form, inAppAlertsEnabled: value })}
              icon={<Bell size={18} />}
            />

            <SwitchControl
              title="Email alerts"
              description={
                form.emailProvider === "NONE"
                  ? "Select a provider before enabling email alerts."
                  : "Enable email delivery for eligible notification events."
              }
              checked={form.emailAlertsEnabled}
              disabled={form.emailProvider === "NONE"}
              onChange={(value) => setForm({ ...form, emailAlertsEnabled: value })}
              icon={<Mail size={18} />}
            />

            <SwitchControl
              title="Payment updates"
              description="Notify users about invoices, confirmations and wallet/payment activity."
              checked={form.paymentUpdatesEnabled}
              onChange={(value) => setForm({ ...form, paymentUpdatesEnabled: value })}
              icon={<CreditCard size={18} />}
            />

            <SwitchControl
              title="Approval notifications"
              description="Notify users about phase approvals, requests and change feedback."
              checked={form.approvalNotificationsEnabled}
              onChange={(value) =>
                setForm({ ...form, approvalNotificationsEnabled: value })
              }
              icon={<ShieldCheck size={18} />}
            />

            <SwitchControl
              title="Project updates"
              description="Notify users about project milestones and activity."
              checked={form.projectUpdatesEnabled}
              onChange={(value) => setForm({ ...form, projectUpdatesEnabled: value })}
              icon={<FileText size={18} />}
            />

            <SwitchControl
              title="Support messages"
              description="Notify users about support conversations and replies."
              checked={form.supportMessagesEnabled}
              onChange={(value) => setForm({ ...form, supportMessagesEnabled: value })}
              icon={<Headphones size={18} />}
            />
          </div>

          <SaveBar
            onRefresh={() => load("refresh")}
            onSave={save}
            saving={saving}
            refreshing={refreshing}
          />
        </section>
      ) : null}

      <AdminEmailTemplateSettings />
    </PanelShell>
  );
}

function ControlCard({ control }: { control: PlannedControl }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.035)]">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-[#0064E0] ring-1 ring-slate-200">
          {control.icon}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-sm font-bold text-slate-950">
              {control.title}
            </strong>
            {statusPill(control.state)}
          </div>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            {control.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function SecurityPoliciesPanel() {
  const controls: PlannedControl[] = [
    {
      title: "Password change",
      description: "Already available from Profile & Security through Better Auth.",
      state: "active",
      icon: <LockKeyhole size={18} />,
    },
    {
      title: "Two-factor authentication",
      description: "Will remain planned until a real 2FA enrollment, recovery and verification flow exists.",
      state: "planned",
      icon: <ShieldCheck size={18} />,
    },
    {
      title: "Active sessions",
      description: "Session management should use real Better Auth session data and safe revoke behavior.",
      state: "planned",
      icon: <Globe2 size={18} />,
    },
    {
      title: "Password policy labels",
      description: "Workspace password policy copy can be admin-managed after security policy storage exists.",
      state: "schema",
      icon: <FileText size={18} />,
    },
  ];

  return (
    <PanelShell
      eyebrow="Security Policies"
      title="Security posture and access controls"
      description="Password changes already work through Better Auth. 2FA, active sessions and workspace-wide security policies need dedicated implementation before activation."
      icon={<ShieldCheck size={24} />}
      side={
        <>
          <h3 className="text-lg font-semibold tracking-[-0.035em] text-slate-950">
            No cosmetic security
          </h3>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            Security controls stay planned until their backend behavior exists.
          </p>
        </>
      }
    >
      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        {controls.map((control) => (
          <ControlCard key={control.title} control={control} />
        ))}
      </section>

      <section className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-orange-700" />
          <p className="m-0 text-sm font-semibold leading-6 text-orange-900">
            2FA and session controls must not be activated until enrollment, recovery, verification and revoke flows are implemented.
          </p>
        </div>
      </section>
    </PanelShell>
  );
}

function SettingsTabContent({ activeTab }: { activeTab: AdminSettingsTab }) {
  if (activeTab === "profile") {
    return (
      <ProfileSettings
        title="Admin Profile"
        subtitle="Manage your admin profile, contact details, and account security."
        showProjectCountdown={false}
      />
    );
  }

  if (activeTab === "payments") {
    return <AdminSystemSettings />;
  }

  if (activeTab === "notifications") {
    return <NotificationControlsPanel />;
  }

  if (activeTab === "support") {
    return <SupportControlsPanel />;
  }

  if (activeTab === "workspace") {
    return <WorkspaceDefaultsPanel />;
  }

  return <SecurityPoliciesPanel />;
}

export function AdminSettingsHub() {
  const [activeTab, setActiveTab] = useState<AdminSettingsTab>("profile");

  return (
    <>
      <AdminSettingsHeader activeTab={activeTab} onSelect={setActiveTab} />
      <SettingsTabContent activeTab={activeTab} />
    </>
  );
}
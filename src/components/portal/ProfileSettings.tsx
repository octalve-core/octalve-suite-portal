"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  Globe2,
  Info,
  Languages,
  Laptop,
  LockKeyhole,
  Mail,
  MonitorCheck,
  Phone,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  UserRoundCog,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import type { WorkspacePublicSettings } from "@/lib/types";
import { useApp } from "./AppContext";
import { Button, Modal } from "./UI";

function roleDisplay(role?: string) {
  if (!role) return "Workspace User";
  if (role === "SUPER_ADMIN") return "Administrator";
  if (role === "PROJECT_MANAGER") return "Project Manager";
  if (role === "STAFF") return "Staff";
  return "Client";
}

function accountType(role?: string) {
  if (role === "SUPER_ADMIN") return "Admin Account";
  if (role === "PROJECT_MANAGER") return "Project Manager Account";
  if (role === "STAFF") return "Staff Account";
  return "Client Account";
}

function roleDataAccess(role?: string) {
  if (role === "SUPER_ADMIN") return "Workspace Administration";
  if (role === "PROJECT_MANAGER") return "Assigned Projects & Team Delivery";
  if (role === "STAFF") return "Assigned Project Phases";
  return "Projects You Are Added To";
}

function getInitial(name?: string) {
  return name?.trim()?.[0]?.toUpperCase() || "O";
}

function formatAccountId(id?: string) {
  if (!id) return "Not available";
  if (id.length <= 12) return id;
  return `${id.slice(0, 4)}-${id.slice(-8)}`;
}

function formatSettingLabel(value?: string) {
  if (!value) return "Not set";

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function ReadinessBadge({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "green" | "orange" | "slate";
}) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-[#0064E0]",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
        tones[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function SettingsCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.025)] sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
          {icon}
        </span>

        <div>
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
            {title}
          </h2>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

function IdentityMetric({
  label,
  value,
  icon,
  tone = "blue",
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: "blue" | "green" | "slate";
}) {
  const tones = {
    blue: "bg-blue-50 text-[#0064E0] ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    slate: "bg-slate-50 text-slate-500 ring-slate-200",
  };

  return (
    <div className="flex min-w-0 items-center gap-4 border-t border-slate-100 pt-4 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
      <span
        className={[
          "grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1",
          tones[tone],
        ].join(" ")}
      >
        {icon}
      </span>

      <div className="min-w-0">
        <span className="block text-sm font-semibold text-slate-500">
          {label}
        </span>
        <strong className="mt-1 block truncate text-sm font-semibold text-slate-950">
          {value}
        </strong>
      </div>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  readOnly,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
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
        readOnly={readOnly}
        disabled={readOnly}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        className={[
          "h-11 w-full rounded-xl border px-3 text-sm font-semibold outline-none transition",
          readOnly
            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500"
            : "border-slate-200 bg-white text-slate-950 focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100",
        ].join(" ")}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  disabled,
  children,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
        onChange={() => undefined}
      >
        {children}
      </select>
    </label>
  );
}

function SecurityRow({
  icon,
  title,
  description,
  badge,
  actionLabel,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: React.ReactNode;
  actionLabel?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-slate-100 py-4 last:border-b-0">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-50 text-slate-500 ring-1 ring-slate-200">
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

      {badge ? <div className="hidden sm:block">{badge}</div> : null}

      {actionLabel ? (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0064E0] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        >
          {actionLabel}
          <ChevronRight size={15} />
        </button>
      ) : (
        <ChevronRight size={16} className="hidden text-slate-300 sm:block" />
      )}
    </div>
  );
}

function NotificationPreferenceRow({
  title,
  description,
  enabled,
  icon,
}: {
  title: string;
  description: string;
  enabled: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-b-0">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-200">
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <strong className="block text-sm font-semibold text-slate-950">
          {title}
        </strong>
        <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">
          {description}
        </span>
      </div>

      <span
        className={[
          "relative inline-flex h-7 w-12 shrink-0 rounded-full border transition",
          enabled
            ? "border-blue-200 bg-[#0064E0]"
            : "border-slate-200 bg-slate-200",
        ].join(" ")}
        aria-hidden="true"
      >
        <span
          className={[
            "absolute top-0.5 h-5.5 w-5.5 rounded-full bg-white shadow-sm transition",
            enabled ? "left-6" : "left-0.5",
          ].join(" ")}
        />
      </span>
    </div>
  );
}

function ProtectionRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-b-0">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <strong className="max-w-[60%] truncate text-right text-sm font-semibold text-slate-950">
        {value}
      </strong>
    </div>
  );
}

function PasswordModal({ onClose }: { onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  async function submit() {
    setError("");
    setMessage("");

    if (!form.currentPassword || !form.newPassword) {
      setError("Current password and new password are required.");
      return;
    }

    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setSaving(true);

    try {
      const result = await authClient.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        revokeOtherSessions: true,
      });

      if (result?.error) {
        setError(result.error.message || "Could not change password.");
        setSaving(false);
        return;
      }

      setMessage("Password changed successfully.");
      window.setTimeout(onClose, 900);
    } catch {
      setError("Password change failed. Please confirm your current password.");
      setSaving(false);
    }
  }

  const inputType = visible ? "text" : "password";

  return (
    <Modal title="Change Password" onClose={onClose} width="540px">
      <div className="grid gap-4">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {message}
          </div>
        ) : null}

        <FieldInput
          label="Current password"
          type={inputType}
          value={form.currentPassword}
          onChange={(value) => setForm({ ...form, currentPassword: value })}
          placeholder="Enter current password"
        />

        <FieldInput
          label="New password"
          type={inputType}
          value={form.newPassword}
          onChange={(value) => setForm({ ...form, newPassword: value })}
          placeholder="Minimum 8 characters"
        />

        <FieldInput
          label="Confirm new password"
          type={inputType}
          value={form.confirmPassword}
          onChange={(value) => setForm({ ...form, confirmPassword: value })}
          placeholder="Repeat new password"
        />

        <button
          type="button"
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0064E0]"
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          {visible ? "Hide passwords" : "Show passwords"}
        </button>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button loading={saving} onClick={submit}>
            Update Password
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function ProfileSettings({
  title = "Settings",
  subtitle = "Manage your profile and workspace preferences.",
  showProjectCountdown = false,
}: {
  title?: string;
  subtitle?: string;
  showProjectCountdown?: boolean;
}) {
  const { currentUser, refresh } = useApp();

  const [workspacePublicSettings, setWorkspacePublicSettings] =
    useState<WorkspacePublicSettings | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: currentUser?.name ?? "",
    email: currentUser?.email ?? "",
    phone: currentUser?.phone ?? "",
    company: currentUser?.company ?? "",
    specialty: currentUser?.specialty ?? "",
    secondaryPhone: "",
    preferredContactMethod: "Email",
  });

  useEffect(() => {
    setForm((value) => ({
      ...value,
      name: currentUser?.name ?? "",
      email: currentUser?.email ?? "",
      phone: currentUser?.phone ?? "",
      company: currentUser?.company ?? "",
      specialty: currentUser?.specialty ?? "",
    }));
  }, [
    currentUser?.company,
    currentUser?.email,
    currentUser?.name,
    currentUser?.phone,
    currentUser?.specialty,
  ]);

  useEffect(() => {
    let alive = true;

    api.workspacePublicSettings
      .get()
      .then((settings) => {
        if (alive) setWorkspacePublicSettings(settings);
      })
      .catch(() => {
        if (alive) setWorkspacePublicSettings(null);
      });

    return () => {
      alive = false;
    };
  }, []);

  const notificationCount = useMemo(
    () => ({
      emailAlerts: workspacePublicSettings?.notifications.emailAlertsEnabled ?? false,
      paymentUpdates:
        workspacePublicSettings?.notifications.paymentUpdatesEnabled ?? true,
      approvalNotifications:
        workspacePublicSettings?.notifications.approvalNotificationsEnabled ?? true,
      projectUpdates:
        workspacePublicSettings?.notifications.projectUpdatesEnabled ?? true,
      supportMessages:
        workspacePublicSettings?.notifications.supportMessagesEnabled ?? false,
    }),
    [workspacePublicSettings?.notifications],
  );

  const workspaceDefaults = workspacePublicSettings?.workspaceDefaults;
  const timezoneValue = workspaceDefaults?.defaultTimezone ?? "Africa/Lagos";
  const languageValue = workspaceDefaults?.defaultLanguage ?? "English (US)";
  const updateFrequencyValue = workspaceDefaults?.updateFrequency ?? "WEEKLY_DIGEST";
  const emailDigestValue =
    workspaceDefaults?.emailDigest ?? "SUMMARY_OF_ALL_ACTIVITY";
  const timezoneLabel =
    timezoneValue === "Africa/Lagos"
      ? "(GMT+01:00) West Africa Time (Lagos)"
      : formatSettingLabel(timezoneValue);
  const clientOverrideLabel = workspaceDefaults?.allowClientPreferenceOverride
    ? "Personal override allowed by admin."
    : "Controlled by workspace administrator.";

  async function updateProfile() {
    setError("");
    setNotice("");

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          company: form.company,
          specialty: form.specialty,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "Could not update profile.");
        setSaving(false);
        return;
      }

      await refresh();
      setNotice("Profile updated successfully.");
      window.setTimeout(() => setNotice(""), 2400);
    } catch {
      setError("Could not update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-5">
        <header>
          <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.06em] text-slate-950 sm:text-[40px]">
            {title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
            {subtitle}
          </p>
        </header>

        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.025)] sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_1.7fr] lg:items-center">
            <div className="flex min-w-0 items-center gap-5">
              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-blue-50 text-3xl font-semibold text-[#0064E0] ring-1 ring-blue-100 sm:h-24 sm:w-24">
                {getInitial(form.name)}
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-2xl font-semibold tracking-[-0.045em] text-slate-950">
                    {form.name || "Workspace User"}
                  </h2>
                  <ReadinessBadge>{roleDisplay(currentUser?.role)}</ReadinessBadge>
                </div>

                <p className="mt-2 truncate text-sm font-semibold text-slate-500">
                  {form.email || "No email available"}
                </p>
                <p className="mt-1 truncate text-sm font-medium text-slate-500">
                  {form.company || "Company not set"}
                </p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <IdentityMetric
                label="Access Role"
                value={roleDisplay(currentUser?.role)}
                icon={<BriefcaseBusiness size={20} />}
              />

              <IdentityMetric
                label="Member Since"
                value="Not available"
                icon={<CalendarDays size={20} />}
                tone="slate"
              />

              <IdentityMetric
                label="Account Status"
                value={
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Active
                  </span>
                }
                icon={<ShieldCheck size={20} />}
                tone="green"
              />
            </div>
          </div>
        </section>

        {notice ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_520px]">
          <SettingsCard
            title="Profile Information"
            subtitle="Keep your personal and company details up to date."
            icon={<UserRound size={20} />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FieldInput
                label="Full Name"
                value={form.name}
                onChange={(value) => setForm({ ...form, name: value })}
              />

              <FieldInput label="Email Address" value={form.email} readOnly />

              <FieldInput
                label="Phone"
                value={form.phone}
                onChange={(value) => setForm({ ...form, phone: value })}
                placeholder="Not provided"
              />

              <FieldInput
                label="Company / Brand"
                value={form.company}
                onChange={(value) => setForm({ ...form, company: value })}
                placeholder="Not provided"
              />

              <FieldInput
                label="Role Label"
                value={form.specialty}
                onChange={(value) => setForm({ ...form, specialty: value })}
                placeholder={roleDisplay(currentUser?.role)}
              />

              <FieldInput
                label="Secondary Phone"
                value={form.secondaryPhone}
                readOnly
                placeholder="Admin-managed later"
              />

              <SelectField label="Preferred Contact Method" value={form.preferredContactMethod} disabled>
                <option value="Email">Email</option>
              </SelectField>

              <div className="flex items-end justify-end">
                <button
                  type="button"
                  onClick={updateProfile}
                  disabled={saving}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0064E0] px-5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(0,100,224,0.08)] transition hover:bg-[#0052B8] disabled:cursor-wait disabled:opacity-70 md:w-auto"
                >
                  <Save size={16} />
                  {saving ? "Updating..." : "Update Profile"}
                </button>
              </div>
            </div>
          </SettingsCard>

          <SettingsCard
            title="Account Security"
            subtitle="Protect your account and manage access security."
            icon={<ShieldCheck size={20} />}
          >
            <SecurityRow
              icon={<LockKeyhole size={18} />}
              title="Change Password"
              description="Update your password regularly."
              actionLabel="Change Password"
              onClick={() => setPasswordOpen(true)}
            />

            <SecurityRow
              icon={<ShieldCheck size={18} />}
              title="Two-Factor Authentication"
              description="Extra security is planned for a later security batch."
              badge={<ReadinessBadge tone="slate">Upcoming</ReadinessBadge>}
              disabled
            />

            <SecurityRow
              icon={<Clock3 size={18} />}
              title="Last Password Update"
              description="Password history is not exposed in this workspace view."
              badge={<ReadinessBadge tone="slate">Protected</ReadinessBadge>}
            />

            <SecurityRow
              icon={<Laptop size={18} />}
              title="Active Sessions"
              description="Session management will be handled in a dedicated security batch."
              actionLabel="Managed Later"
              disabled
            />
          </SettingsCard>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <SettingsCard
            title="Notification Preferences"
            subtitle="Choose what updates you want to receive."
            icon={<Bell size={20} />}
          >
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold leading-6 text-blue-900">
              Notification defaults are controlled by the workspace administrator. Email alerts only appear active when admin enables them.
            </div>

            <div className="mt-3">
              <NotificationPreferenceRow
                title="Email Alerts"
                description="Important account and system alerts."
                enabled={notificationCount.emailAlerts}
                icon={<Mail size={16} />}
              />
              <NotificationPreferenceRow
                title="Payment Updates"
                description="Invoices, payments, and billing notifications."
                enabled={notificationCount.paymentUpdates}
                icon={<Bell size={16} />}
              />
              <NotificationPreferenceRow
                title="Approval Notifications"
                description="Updates on approvals and submissions."
                enabled={notificationCount.approvalNotifications}
                icon={<ShieldCheck size={16} />}
              />
              <NotificationPreferenceRow
                title="Project Updates"
                description="Task, milestone, and project activity updates."
                enabled={notificationCount.projectUpdates}
                icon={<BriefcaseBusiness size={16} />}
              />
              <NotificationPreferenceRow
                title="Support Messages"
                description="Messages and responses from support."
                enabled={notificationCount.supportMessages}
                icon={<Mail size={16} />}
              />
            </div>
          </SettingsCard>

          <SettingsCard
            title="Workspace Preferences"
            subtitle="Customize your workspace experience."
            icon={<SlidersHorizontal size={20} />}
          >
            <div className="grid gap-4">
              <SelectField label="Preferred Timezone" value={timezoneValue} disabled>
                <option value={timezoneValue}>{timezoneLabel}</option>
              </SelectField>

              <SelectField label="Update Frequency" value={updateFrequencyValue} disabled>
                <option value={updateFrequencyValue}>
                  {formatSettingLabel(updateFrequencyValue)}
                </option>
              </SelectField>

              <SelectField label="Language" value={languageValue} disabled>
                <option value={languageValue}>{languageValue}</option>
              </SelectField>

              <SelectField label="Email Digest" value={emailDigestValue} disabled>
                <option value={emailDigestValue}>
                  {formatSettingLabel(emailDigestValue)}
                </option>
              </SelectField>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
                These preferences are read from admin workspace defaults. {clientOverrideLabel}
              </div>
            </div>
          </SettingsCard>

          <SettingsCard
            title="Account Protection"
            subtitle="Your role and account details are managed securely."
            icon={<MonitorCheck size={20} />}
          >
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex gap-3">
                <Info size={18} className="mt-0.5 shrink-0 text-[#0064E0]" />
                <p className="m-0 text-sm font-bold leading-6 text-blue-900">
                  Your account role and access permissions are managed by the workspace administrator.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <ProtectionRow label="Role" value={roleDisplay(currentUser?.role)} />
              <ProtectionRow label="Account Type" value={accountType(currentUser?.role)} />
              <ProtectionRow label="Data Access" value={roleDataAccess(currentUser?.role)} />
              <ProtectionRow label="Account ID" value={formatAccountId(currentUser?.id)} />
            </div>
          </SettingsCard>
        </section>

        {showProjectCountdown ? null : null}
      </div>

      {passwordOpen ? <PasswordModal onClose={() => setPasswordOpen(false)} /> : null}
    </main>
  );
}
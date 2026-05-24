"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  Bell,
  CheckCircle2,
  CreditCard,
  FileText,
  Globe2,
  Headphones,
  Languages,
  LockKeyhole,
  Mail,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  ToggleLeft,
  UserRoundCog,
  WalletCards,
} from "lucide-react";

import { AdminSystemSettings } from "./AdminSystemSettings";
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
    description: "In-app alerts are active. Email templates and preferences need storage.",
    icon: <Bell size={18} strokeWidth={2.2} />,
    state: "schema",
  },
  {
    id: "support",
    label: "Support Controls",
    description: "Support email, guide URL and client contact policy controls.",
    icon: <Headphones size={18} strokeWidth={2.2} />,
    state: "schema",
  },
  {
    id: "workspace",
    label: "Workspace Defaults",
    description: "Timezone, language, digest and workspace default preferences.",
    icon: <SlidersHorizontal size={18} strokeWidth={2.2} />,
    state: "planned",
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
                Manage live-backed settings now and clearly separate planned controls until their database/API storage is implemented.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold leading-6 text-blue-900">
            Payment controls are active. Other controls are staged safely until storage is added.
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

function PlannedSettingsPanel({
  eyebrow,
  title,
  description,
  icon,
  controls,
  note,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  controls: PlannedControl[];
  note: string;
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

              <div>
                <h3 className="text-lg font-semibold tracking-[-0.035em] text-slate-950">
                  Controlled rollout
                </h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  {note}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        {controls.map((control) => (
          <ControlCard key={control.title} control={control} />
        ))}
      </section>

      <section className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4">
        <div className="flex items-start gap-3">
          <LockKeyhole size={18} className="mt-0.5 shrink-0 text-orange-700" />
          <p className="m-0 text-sm font-semibold leading-6 text-orange-900">
            These controls are intentionally not editable yet. We will activate them only after the matching schema/API storage is added and validated with pnpm db:generate and pnpm build.
          </p>
        </div>
      </section>
    </main>
  );
}

function NotificationControlsPanel() {
  return (
    <PlannedSettingsPanel
      eyebrow="Notification Controls"
      title="In-app alerts now, email controls next"
      description="Current notification APIs support in-app notification listing and read status. Admin defaults, email templates and preference persistence need dedicated schema before they become editable."
      icon={<Bell size={24} />}
      note="No fake toggles. Current client notification preferences remain display-only until admin-managed notification storage exists."
      controls={[
        {
          title: "In-app notifications",
          description: "Existing Notification records are already used for workspace alerts.",
          state: "active",
          icon: <CheckCircle2 size={18} />,
        },
        {
          title: "Email provider readiness",
          description: "Resend, Brevo or SMTP can be shown later from environment readiness only. Credential values must never be displayed.",
          state: "schema",
          icon: <Mail size={18} />,
        },
        {
          title: "Notification templates",
          description: "Payment, approval, support and project-update templates need a dedicated template model.",
          state: "schema",
          icon: <FileText size={18} />,
        },
        {
          title: "Default notification preferences",
          description: "Client, staff and admin default notification settings need persistence before toggles can save.",
          state: "schema",
          icon: <ToggleLeft size={18} />,
        },
      ]}
    />
  );
}

function SupportControlsPanel() {
  return (
    <PlannedSettingsPanel
      eyebrow="Support Controls"
      title="Support policy control center"
      description="This area will control the support email, guide URL, phase-thread preference and safe payment-dispute instructions used across client support screens."
      icon={<Headphones size={24} />}
      note="The current client support page uses fixed safe defaults. Admin-editable support policy needs storage before activation."
      controls={[
        {
          title: "Support email",
          description: "Admin-controlled support recipient for client help requests.",
          state: "schema",
          icon: <Mail size={18} />,
        },
        {
          title: "Guide URL",
          description: "Admin-managed help resource URL currently planned around Octalve Trends.",
          state: "schema",
          icon: <Globe2 size={18} />,
        },
        {
          title: "Phase-message support preference",
          description: "Control whether clients are pushed first to phase threads for project-linked conversations.",
          state: "schema",
          icon: <Headphones size={18} />,
        },
        {
          title: "Payment dispute safety text",
          description: "Admin-managed reminder not to request OTPs, card details, passwords, private keys or admin credentials.",
          state: "schema",
          icon: <ShieldCheck size={18} />,
        },
      ]}
    />
  );
}

function WorkspaceDefaultsPanel() {
  return (
    <PlannedSettingsPanel
      eyebrow="Workspace Defaults"
      title="Default workspace preferences"
      description="Timezone, language, update frequency and digest defaults should be controlled here once persistence exists."
      icon={<SlidersHorizontal size={24} />}
      note="Client and staff settings currently show these as disabled display-only values, which is safer than fake saved preferences."
      controls={[
        {
          title: "Default timezone",
          description: "Workspace-wide default timezone, for example West Africa Time.",
          state: "schema",
          icon: <Globe2 size={18} />,
        },
        {
          title: "Default language",
          description: "Workspace-wide language preference for future interface and email content.",
          state: "schema",
          icon: <Languages size={18} />,
        },
        {
          title: "Digest frequency",
          description: "Default update cadence for project, approval, support and payment summaries.",
          state: "schema",
          icon: <Bell size={18} />,
        },
        {
          title: "Workspace preference lock",
          description: "Control whether clients can override defaults or inherit admin-managed settings.",
          state: "planned",
          icon: <LockKeyhole size={18} />,
        },
      ]}
    />
  );
}

function SecurityPoliciesPanel() {
  return (
    <PlannedSettingsPanel
      eyebrow="Security Policies"
      title="Security posture and access controls"
      description="Password changes already work through Better Auth. 2FA, active sessions and workspace-wide security policies need dedicated implementation before activation."
      icon={<ShieldCheck size={24} />}
      note="Security controls must not be cosmetic. Each control will be activated only when the backend behavior exists."
      controls={[
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
          description: "Workspace password policy copy can be admin-managed once security policy storage exists.",
          state: "schema",
          icon: <FileText size={18} />,
        },
      ]}
    />
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
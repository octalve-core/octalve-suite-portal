"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { CreditCard, ShieldCheck, UserRoundCog } from "lucide-react";

import { AdminSystemSettings } from "./AdminSystemSettings";
import { ProfileSettings } from "./ProfileSettings";

type AdminSettingsTab = "profile" | "payments";

const tabs: Array<{
  id: AdminSettingsTab;
  label: string;
  description: string;
  icon: ReactNode;
}> = [
  {
    id: "profile",
    label: "Profile & Security",
    description: "Admin identity, contact details and password security.",
    icon: <UserRoundCog size={18} strokeWidth={2.2} />,
  },
  {
    id: "payments",
    label: "Payment Settings",
    description: "Bank transfer details, gateway availability and provider readiness.",
    icon: <CreditCard size={18} strokeWidth={2.2} />,
  },
];

function tabButtonClass(active: boolean) {
  return [
    "flex min-w-[220px] flex-1 items-start gap-3 rounded-2xl border px-4 py-4 text-left transition",
    active
      ? "border-[#0064E0] bg-blue-50 text-slate-950 shadow-[0_12px_30px_rgba(0,100,224,0.12)]"
      : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50",
  ].join(" ");
}

export function AdminSettingsHub() {
  const [activeTab, setActiveTab] = useState<AdminSettingsTab>("profile");

  return (
    <>
      <section className="content">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="mb-5 flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
              <ShieldCheck size={20} strokeWidth={2.2} />
            </span>

            <div>
              <span className="text-xs font-black uppercase tracking-[0.16em] text-[#0064E0]">
                Admin Settings
              </span>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.045em] text-slate-950">
                Profile, security and payment configuration
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                Manage your admin account separately from system payment settings. Gateway secrets remain server-only and are never displayed.
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  className={tabButtonClass(active)}
                  onClick={() => setActiveTab(tab.id)}
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
                  <span>
                    <strong className="block text-sm font-bold">{tab.label}</strong>
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

      {activeTab === "profile" ? (
        <ProfileSettings
          title="Admin Profile"
          subtitle="Manage your admin profile, contact details, and account security"
        />
      ) : (
        <AdminSystemSettings />
      )}
    </>
  );
}
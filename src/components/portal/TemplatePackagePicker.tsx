"use client";

import { type ReactNode } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Code2,
  Gem,
  Globe2,
  Grid2X2,
  Handshake,
  HeartHandshake,
  Landmark,
  LayoutList,
  MonitorSmartphone,
  Palette,
  Rows3,
  Rocket,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";

import type { PackageType, ProjectTemplate } from "@/lib/types";
import { PACKAGE_CATALOG, getPackageCatalogItem } from "./packageCatalog";

export type TemplatePickerLayout = "grid" | "compact" | "list";
export type TemplatePickerRole = "client" | "admin" | "staff";

export type TemplatePickerOption = {
  id: string;
  type: PackageType;
  title: string;
  description: string;
  category: string;
  color: string;
  template: ProjectTemplate | null;
  isLiveTemplate: boolean;
};

export const OCTALVE_COLORS = {
  blue: "#0064E0",
  red: "#E61525",
  green: "#29BE3E",
  orange: "#FC7E24",
  purple: "#5300D9",
  deepPurple: "#2A006D",
  ink: "#000A16",
  slate: "#0F172A",
  soft: "#F8FAFC",
  border: "#E2E8F0",
  muted: "#64748B",
} as const;

const packageIcons: Record<PackageType, ReactNode> = {
  Launch: <Rocket size={21} />,
  Impact: <HeartHandshake size={21} />,
  Growth: <TrendingUp size={21} />,
  Partner: <Handshake size={21} />,
  WebsiteStarter: <Globe2 size={21} />,
  WebsiteProBiz: <MonitorSmartphone size={21} />,
  WebsiteAdvance: <Code2 size={21} />,
  BrandingStarter: <Palette size={21} />,
  BrandingProBiz: <BadgeCheck size={21} />,
  BrandingAdvance: <Gem size={21} />,
  LeapRegistration: <Landmark size={21} />,
  Custom: <SlidersHorizontal size={21} />,
};

const roleAccent: Record<TemplatePickerRole, string> = {
  client: OCTALVE_COLORS.blue,
  admin: OCTALVE_COLORS.red,
  staff: OCTALVE_COLORS.green,
};

const layoutOptions: Array<{
  key: TemplatePickerLayout;
  label: string;
  icon: ReactNode;
}> = [
  { key: "grid", label: "Grid", icon: <Grid2X2 size={14} /> },
  { key: "compact", label: "Compact", icon: <Rows3 size={14} /> },
  { key: "list", label: "List", icon: <LayoutList size={14} /> },
];

export function getTemplatePackageOptions(
  templates: ProjectTemplate[],
): TemplatePickerOption[] {
  if (templates.length > 0) {
    return templates.map((template) => {
      const catalog = getPackageCatalogItem(template.packageType);

      return {
        id: template.id,
        type: template.packageType,
        title: template.name || catalog.title,
        description: template.description || catalog.description,
        category: catalog.category,
        color: catalog.color,
        template,
        isLiveTemplate: true,
      };
    });
  }

  return PACKAGE_CATALOG.map((item) => ({
    id: `catalog-${item.type}`,
    type: item.type,
    title: item.title,
    description: item.description,
    category: item.category,
    color: item.color,
    template: null,
    isLiveTemplate: false,
  }));
}

function getPhaseCount(option: TemplatePickerOption) {
  return option.template?.phases?.length ?? getPackageCatalogItem(option.type).phases.length;
}

function getDeliverableCount(option: TemplatePickerOption) {
  if (option.template?.phases?.length) {
    return option.template.phases.reduce(
      (total, phase) => total + (phase.deliverables?.length ?? 0),
      0,
    );
  }

  return getPackageCatalogItem(option.type).phases.reduce(
    (total, phase) => total + phase.deliverables.length,
    0,
  );
}

export function TemplatePackagePicker({
  templates,
  selectedId,
  onSelect,
  role = "client",
  layout = "grid",
  onLayoutChange,
  showLayoutSwitch = true,
  heading = "Select Package / Suite",
  description = "Choose the delivery workflow that matches this project. The options below are controlled from Admin Templates.",
}: {
  templates: ProjectTemplate[];
  selectedId: string;
  onSelect: (option: TemplatePickerOption) => void;
  role?: TemplatePickerRole;
  layout?: TemplatePickerLayout;
  onLayoutChange?: (layout: TemplatePickerLayout) => void;
  showLayoutSwitch?: boolean;
  heading?: string;
  description?: string;
}) {
  const options = getTemplatePackageOptions(templates);
  const accent = roleAccent[role];

  const gridClass =
    layout === "compact"
      ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
      : layout === "list"
        ? "grid-cols-1"
        : "grid-cols-1 lg:grid-cols-2";

  return (
    <section>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.035em] text-slate-950">
            {heading}
          </h2>
          <p className="mt-2 max-w-[760px] text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>

        {showLayoutSwitch && onLayoutChange ? (
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1.5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            {layoutOptions.map((option) => {
              const active = layout === option.key;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onLayoutChange(option.key)}
                  className={[
                    "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold transition",
                    active ? "text-white" : "text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                  style={active ? { backgroundColor: accent } : undefined}
                >
                  {option.icon}
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className={`grid gap-4 ${gridClass}`}>
        {options.map((option) => {
          const selected = selectedId === option.id;
          const phases = getPhaseCount(option);
          const deliverables = getDeliverableCount(option);

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option)}
              className={[
                "group relative w-full rounded-[24px] border bg-white p-5 text-left transition",
                "shadow-[0_14px_34px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(15,23,42,0.09)]",
                layout === "list"
                  ? "grid min-h-[118px] grid-cols-[auto,minmax(0,1fr),auto] items-center gap-5"
                  : "min-h-[166px]",
              ].join(" ")}
              style={{
                borderColor: selected ? option.color : OCTALVE_COLORS.border,
                boxShadow: selected
                  ? `0 0 0 4px ${option.color}22, 0 20px 45px rgba(15,23,42,0.09)`
                  : undefined,
              }}
            >
              <span
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
                style={{
                  backgroundColor: `${option.color}14`,
                  color: option.color,
                }}
              >
                {packageIcons[option.type]}
              </span>

              <span className={layout === "list" ? "block" : "mt-5 block"}>
                <span
                  className="mb-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em]"
                  style={{
                    backgroundColor: `${option.color}14`,
                    color: option.color,
                  }}
                >
                  {option.category}
                </span>

                <span className="block text-[17px] font-semibold tracking-[-0.03em] text-slate-950">
                  {option.title}
                </span>

                <span className="mt-2 block max-w-[640px] text-sm leading-6 text-slate-600">
                  {option.description}
                </span>

                <span className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                  <span>{phases} phases</span>
                  <span>{deliverables} deliverables</span>
                  <span>
                    {option.isLiveTemplate ? "Admin-managed" : "Default fallback"}
                  </span>
                </span>
              </span>

              {selected ? (
                <span
                  className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full"
                  style={{
                    backgroundColor: `${option.color}14`,
                    color: option.color,
                  }}
                >
                  <CheckCircle2 size={18} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
"use client";

import { type CSSProperties, type ReactNode, useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
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
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { type PackageType } from "@/lib/types";
import {
  PACKAGE_CATALOG,
  getPackageCatalogItem,
  getPackagePhases,
  getPackageTitle,
  type PackageDeliverable,
} from "./packageCatalog";
import { useApp } from "./AppContext";
import {
  BackLink,
  Badge,
  Button,
  Card,
  Field,
  Input,
  Textarea,
  packageClass,
} from "./UI";

type LayoutMode = "grid" | "compact" | "list";

const iconMap: Record<PackageType, ReactNode> = {
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

const layoutOptions: Array<{
  key: LayoutMode;
  label: string;
  icon: ReactNode;
}> = [
  { key: "grid", label: "Grid", icon: <Grid2X2 size={14} /> },
  { key: "compact", label: "Compact", icon: <Rows3 size={14} /> },
  { key: "list", label: "List", icon: <LayoutList size={14} /> },
];

function recommendPackageLocal(text: string): PackageType {
  const value = text.toLowerCase();

  if (/(cac|registration|register|tin|compliance|licence|license|vat|tax)/.test(value)) {
    return "LeapRegistration";
  }

  if (/(brand|logo|identity|packaging|brochure|signage)/.test(value)) {
    return "BrandingProBiz";
  }

  if (/(website|web|ecommerce|e-commerce|landing|portal|online store)/.test(value)) {
    return "WebsiteProBiz";
  }

  if (/(ngo|foundation|campaign|donation|impact|volunteer)/.test(value)) {
    return "Impact";
  }

  if (/(growth|automation|sales|crm|system|leads|conversion)/.test(value)) {
    return "Growth";
  }

  return "Launch";
}

function formatDate(value: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function normalizeDeliverables(items: unknown): PackageDeliverable[] {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => {
    if (typeof item === "string") {
      return {
        title: item,
        description: "Client-visible deliverable prepared for review.",
      };
    }

    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;

      return {
        title: String(record.title ?? record.name ?? `Deliverable ${index + 1}`),
        description: String(
          record.description ??
            record.note ??
            "Client-visible deliverable prepared for review.",
        ),
      };
    }

    return {
      title: `Deliverable ${index + 1}`,
      description: "Client-visible deliverable prepared for review.",
    };
  });
}

export function ClientCreateProjectExpanded() {
  const { state, createProjectRequest } = useApp();

  const [step, setStep] = useState(1);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("grid");
  const [packageType, setPackageType] = useState<PackageType>("Launch");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    projectName: "",
    businessName: "",
    preferredStartDate: "",
    targetDeliveryDate: "",
    projectGoal: "",
    projectDescription: "",
    additionalNotes: "",
  });

  const packageOptions = useMemo(() => {
    return PACKAGE_CATALOG.map((item) => {
      const template = state.templates.find(
        (template) => template.packageType === item.type,
      );

      return {
        ...item,
        title: item.title,
        description: template?.description || item.description,
        template,
      };
    });
  }, [state.templates]);

  const selectedPackage = getPackageCatalogItem(packageType);

  const template =
    state.templates.find((template) => template.packageType === packageType) ??
    null;

  const displayPhases = useMemo(() => {
    if (template?.phases?.length) {
      return template.phases.map((phase, index) => {
        const fallback = selectedPackage.phases[index];

        return {
          id: phase.id ?? `${packageType}-${index}`,
          title: phase.title || fallback?.title || `Phase ${index + 1}`,
          description:
            phase.description ||
            fallback?.description ||
            "Structured delivery phase prepared for client review.",
          deliverables:
            normalizeDeliverables((phase as any).deliverables).length > 0
              ? normalizeDeliverables((phase as any).deliverables)
              : fallback?.deliverables ?? [],
        };
      });
    }

    return getPackagePhases(packageType).map((phase, index) => ({
      id: `${packageType}-${index}`,
      ...phase,
    }));
  }, [packageType, selectedPackage.phases, template]);

  const aiPackage = useMemo(
    () => recommendPackageLocal(`${form.projectGoal} ${form.projectDescription}`),
    [form.projectGoal, form.projectDescription],
  );

  const preferredTimeline = [
    form.preferredStartDate ? `Start: ${formatDate(form.preferredStartDate)}` : "",
    form.targetDeliveryDate ? `Target: ${formatDate(form.targetDeliveryDate)}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  function validateStep(targetStep = step) {
    if (targetStep !== 2 && targetStep !== 3) return "";

    if (!form.projectName.trim()) return "Project name is required.";
    if (!form.businessName.trim()) return "Business or brand name is required.";
    if (!form.preferredStartDate.trim()) return "Preferred start date is required.";
    if (!form.targetDeliveryDate.trim()) return "Target delivery date is required.";
    if (!form.projectGoal.trim()) return "Project goal is required.";
    if (!form.projectDescription.trim()) return "Project description is required.";

    if (new Date(form.targetDeliveryDate) < new Date(form.preferredStartDate)) {
      return "Target delivery date cannot be earlier than the preferred start date.";
    }

    if (form.projectGoal.trim().length < 20) {
      return "Project goal should be more specific. Add the business outcome you want to achieve.";
    }

    if (form.projectDescription.trim().length < 40) {
      return "Project description should include enough context for Octalve to understand the scope.";
    }

    return "";
  }

  function goNext() {
    const error = step === 2 ? validateStep(2) : "";

    if (error) {
      setFormError(error);
      return;
    }

    setFormError("");
    setStep((value) => Math.min(value + 1, 3));
  }

  function structureWithAI() {
    const selectedTitle = getPackageTitle(packageType);
    const phaseSummary = displayPhases
      .slice(0, 4)
      .map((phase, index) => `${index + 1}. ${phase.title}`)
      .join("; ");

    const outcome =
      packageType === "LeapRegistration"
        ? "establish a credible, compliant and business-ready foundation"
        : packageType.startsWith("Branding")
          ? "build a clearer, more credible and consistent brand identity"
          : packageType.startsWith("Website")
            ? "create a professional digital experience that improves trust, clarity and enquiries"
            : packageType === "Growth"
              ? "improve conversion, sales structure and operational growth flow"
              : packageType === "Impact"
                ? "communicate the mission clearly and improve supporter readiness"
                : "deliver a structured business outcome with clear phases and accountable handoff";

    setForm({
      ...form,
      projectGoal:
        form.projectGoal ||
        `Use the ${selectedTitle} to ${outcome} for ${form.businessName || "the business"}.`,
      projectDescription:
        form.projectDescription ||
        `The project should be structured around ${selectedTitle}. Octalve should clarify the scope, define the delivery phases, prepare client-visible deliverables, manage approvals, and hand over the final outputs in a way that supports practical business use. Proposed delivery flow: ${phaseSummary}.`,
      additionalNotes:
        form.additionalNotes ||
        `Please align this request with the selected package: ${selectedTitle}. The delivery should prioritize clarity, professional presentation, client review points, and measurable handoff outcomes.`,
    });

    setFormError("");
  }

  async function submitRequest() {
    const error = validateStep(3);

    if (error) {
      setFormError(error);
      setStep(2);
      return;
    }

    setLoading(true);
    setFormError("");

    try {
      await createProjectRequest({
        projectName: form.projectName,
        businessName: form.businessName,
        preferredTimeline,
        projectGoal: form.projectGoal,
        projectDescription: form.projectDescription,
        additionalNotes: form.additionalNotes,
        packageType,
      });

      window.location.href = "/client/projects";
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not submit project request.",
      );
    } finally {
      setLoading(false);
    }
  }

  const gridClass =
    layoutMode === "compact"
      ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
      : layoutMode === "list"
        ? "grid-cols-1"
        : "grid-cols-1 lg:grid-cols-2";

  const inputClass =
    "h-12 rounded-2xl border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:border-[#0064E0] focus:ring-[#0064E0]/15";

  const textAreaClass =
    "min-h-[118px] rounded-2xl border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:border-[#0064E0] focus:ring-[#0064E0]/15";

  return (
    <div className="content narrow">
      <div className="mx-auto max-w-[1120px] pb-10">
        <BackLink href="/client/projects" label="Cancel" />

        <div className="mb-7 mt-2 rounded-[26px] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="badge-blue">Step {step} of 3</Badge>
            <span className="text-sm font-semibold text-slate-500">
              {step === 1
                ? "Select delivery package"
                : step === 2
                  ? "Complete project brief"
                  : "Confirm request"}
            </span>
          </div>

          <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-end">
            <div>
              <h1 className="max-w-[760px] text-[32px] font-semibold leading-[1.04] tracking-[-0.05em] text-slate-950 sm:text-[44px]">
                Create Project Request
              </h1>

              <p className="mt-3 max-w-[720px] text-sm font-medium leading-6 text-slate-600 sm:text-[15px]">
                Select a delivery package, provide the project context, and Octalve will structure it into a clear workflow for review, execution and handoff.
              </p>
            </div>

            <div className="flex gap-2 lg:justify-end">
              {[1, 2, 3].map((item) => (
                <span
                  key={item}
                  className={[
                    "h-2.5 flex-1 rounded-full lg:w-16 lg:flex-none",
                    step >= item ? "bg-[#0064E0]" : "bg-slate-200",
                  ].join(" ")}
                />
              ))}
            </div>
          </div>
        </div>

        {formError && (
          <div className="mb-5 rounded-2xl bg-[#E61525] px-4 py-3 text-sm font-semibold text-white">
            {formError}
          </div>
        )}

        {step === 1 && (
          <>
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-[22px] font-semibold tracking-[-0.035em] text-slate-950">
                  Select Package / Suite
                </h2>
                <p className="mt-2 max-w-[760px] text-sm leading-6 text-slate-600">
                  Choose the delivery path that matches the work you want Octalve to manage. Each package includes a structured workflow, review points and client-visible deliverables.
                </p>
              </div>

              <div className="inline-flex rounded-full border border-slate-200 bg-white p-1.5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                {layoutOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setLayoutMode(option.key)}
                    className={[
                      "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold transition",
                      layoutMode === option.key
                        ? "bg-[#0064E0] text-white"
                        : "text-slate-600 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {option.icon}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={`grid gap-4 ${gridClass}`}>
              {packageOptions.map((option) => {
                const isSelected = packageType === option.type;
                const colorStyle = {
                  "--package-color": option.color,
                } as CSSProperties;

                return (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => {
                      setPackageType(option.type);
                      setFormError("");
                    }}
                    style={colorStyle}
                    className={[
                      "group relative w-full rounded-[24px] border bg-white p-5 text-left transition",
                      "shadow-[0_14px_34px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(15,23,42,0.09)]",
                      isSelected
                        ? "border-[var(--package-color)] ring-4 ring-[color-mix(in_srgb,var(--package-color)_14%,transparent)]"
                        : "border-slate-200",
                      layoutMode === "list"
                        ? "grid min-h-[118px] grid-cols-[auto,minmax(0,1fr),auto] items-center gap-5"
                        : "min-h-[166px]",
                    ].join(" ")}
                  >
                    <span className="grid h-13 w-13 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--package-color)_12%,white)] text-[var(--package-color)]">
                      {iconMap[option.type]}
                    </span>

                    <span className={layoutMode === "list" ? "block" : "mt-5 block"}>
                      <span className="mb-2 inline-flex rounded-full bg-[color-mix(in_srgb,var(--package-color)_10%,white)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[var(--package-color)]">
                        {option.category}
                      </span>

                      <span className="block text-[17px] font-semibold tracking-[-0.03em] text-slate-950">
                        {option.title}
                      </span>

                      <span className="mt-2 block max-w-[620px] text-sm leading-6 text-slate-600">
                        {option.description}
                      </span>

                      {option.template ? (
                        <span className="mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                          Admin template connected
                        </span>
                      ) : null}
                    </span>

                    {isSelected ? (
                      <span className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-[color-mix(in_srgb,var(--package-color)_12%,white)] text-[var(--package-color)]">
                        <CheckCircle2 size={18} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <Card className="mt-6 overflow-hidden border-slate-200">
              <div className="border-b border-slate-200 bg-white px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Badge className={packageClass(packageType)}>
                      Selected Template
                    </Badge>
                    <h3 className="mt-3 text-xl font-semibold tracking-[-0.035em] text-slate-950">
                      {template?.name || selectedPackage.title}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      {template?.description || selectedPackage.description}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                    <span className="block text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">
                      Workflow
                    </span>
                    <strong className="text-lg text-slate-950">
                      {displayPhases.length} phases
                    </strong>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 bg-slate-50 p-4 sm:p-5">
                {displayPhases.slice(0, 6).map((phase, index) => (
                  <div
                    key={phase.id ?? index}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">
                          Phase {index + 1}
                        </span>
                        <h4 className="mt-1 text-base font-semibold tracking-[-0.02em] text-slate-950">
                          {phase.title}
                        </h4>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {phase.description}
                        </p>
                      </div>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {phase.deliverables.length} deliverables
                      </span>
                    </div>

                    {phase.deliverables.length ? (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {phase.deliverables.slice(0, 4).map((deliverable, deliverableIndex) => (
                          <div
                            key={`${phase.id}-${deliverableIndex}`}
                            className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                          >
                            <strong className="block text-xs font-bold text-slate-900">
                              {deliverable.title}
                            </strong>
                            <span className="mt-1 block text-xs leading-5 text-slate-500">
                              {deliverable.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="mb-3 text-[22px] font-semibold tracking-[-0.035em] text-slate-950">
              Project Brief
            </h2>

            <Card className="border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-7">
              <div className="grid gap-5 lg:grid-cols-2">
                <Field label="Project Name *">
                  <Input
                    className={inputClass}
                    value={form.projectName}
                    onChange={(event) =>
                      setForm({ ...form, projectName: event.target.value })
                    }
                    placeholder="e.g. Business website and launch support"
                  />
                </Field>

                <Field label="Business / Brand Name *">
                  <Input
                    className={inputClass}
                    value={form.businessName}
                    onChange={(event) =>
                      setForm({ ...form, businessName: event.target.value })
                    }
                    placeholder="Enter the business or organization name"
                  />
                </Field>

                <Field label="Preferred Start Date *">
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <Input
                      type="date"
                      className={`${inputClass} pl-11`}
                      value={form.preferredStartDate}
                      onChange={(event) =>
                        setForm({ ...form, preferredStartDate: event.target.value })
                      }
                    />
                  </div>
                </Field>

                <Field label="Target Delivery Date *">
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <Input
                      type="date"
                      className={`${inputClass} pl-11`}
                      value={form.targetDeliveryDate}
                      onChange={(event) =>
                        setForm({ ...form, targetDeliveryDate: event.target.value })
                      }
                    />
                  </div>
                </Field>

                <Field label="Project Goal *">
                  <Textarea
                    className={textAreaClass}
                    value={form.projectGoal}
                    onChange={(event) =>
                      setForm({ ...form, projectGoal: event.target.value })
                    }
                    placeholder="Describe the business outcome this project should achieve."
                  />
                </Field>

                <Field label="Project Scope / Context *">
                  <Textarea
                    className={textAreaClass}
                    value={form.projectDescription}
                    onChange={(event) =>
                      setForm({ ...form, projectDescription: event.target.value })
                    }
                    placeholder="Share the current situation, expected output, audience, references and success target."
                  />
                </Field>

                <Field label="Additional Notes">
                  <Textarea
                    className={`${textAreaClass} lg:col-span-2`}
                    value={form.additionalNotes}
                    onChange={(event) =>
                      setForm({ ...form, additionalNotes: event.target.value })
                    }
                    placeholder="Add useful links, existing assets, preferences, competitors or special instructions."
                  />
                </Field>
              </div>

              <div className="mt-6 rounded-3xl bg-[#0064E0] p-4 text-white sm:flex sm:items-center sm:justify-between sm:gap-5">
                <div>
                  <Badge className="border-white/20 bg-white/15 text-white">
                    <Sparkles size={13} /> AI recommends {getPackageTitle(aiPackage)}
                  </Badge>
                  <p className="mt-2 text-sm font-medium leading-6 text-white/85">
                    Structure this brief around the selected package: {getPackageTitle(packageType)}.
                  </p>
                </div>

                <Button
                  variant="secondary"
                  onClick={structureWithAI}
                  className="mt-4 bg-white text-[#0064E0] sm:mt-0"
                >
                  <Sparkles size={16} /> Structure Brief
                </Button>
              </div>
            </Card>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="mb-3 text-[22px] font-semibold tracking-[-0.035em] text-slate-950">
              Review & Submit
            </h2>

            <Card className="card-body stack">
              <div className="timeline-row">
                <span>Selected Package</span>
                <strong>{getPackageTitle(packageType)}</strong>
              </div>

              <div className="timeline-row">
                <span>Project</span>
                <strong>{form.projectName || "Not provided"}</strong>
              </div>

              <div className="timeline-row">
                <span>Business</span>
                <strong>{form.businessName || "Not provided"}</strong>
              </div>

              <div className="timeline-row">
                <span>Timeline</span>
                <strong>{preferredTimeline || "Not provided"}</strong>
              </div>

              <div className="workspace-card-context">
                <strong>Goal</strong>
                <span>{form.projectGoal || "Not provided"}</span>
              </div>

              <div className="workspace-card-context">
                <strong>Brief</strong>
                <span>{form.projectDescription || "Not provided"}</span>
              </div>

              {form.additionalNotes && (
                <div className="workspace-card-context">
                  <strong>Additional Notes</strong>
                  <span>{form.additionalNotes}</span>
                </div>
              )}
            </Card>
          </>
        )}

        <div className="sticky bottom-0 z-10 mt-5 flex justify-between gap-3 border-t border-slate-200 bg-[rgba(248,250,252,0.88)] py-4 backdrop-blur">
          <Button
            variant="secondary"
            onClick={() => {
              setFormError("");
              setStep((value) => Math.max(value - 1, 1));
            }}
            disabled={step === 1 || loading}
          >
            Back
          </Button>

          {step < 3 ? (
            <Button onClick={goNext}>Continue</Button>
          ) : (
            <Button loading={loading} onClick={submitRequest}>
              Submit Project Request
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
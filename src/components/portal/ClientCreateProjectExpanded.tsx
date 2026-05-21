"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import { type PackageType } from "@/lib/types";
import {
  getPackageCatalogItem,
  getPackagePhases,
  getPackageTitle,
  type PackageDeliverable,
} from "./packageCatalog";
import {
  TemplatePackagePicker,
  getTemplatePackageOptions,
  type TemplatePickerLayout,
  type TemplatePickerOption,
} from "./TemplatePackagePicker";
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

const CLIENT_PROJECT_REQUEST_DRAFT_KEY = "octalve-client-project-request-draft-v1";

export function ClientCreateProjectExpanded() {
  const { state, createProjectRequest } = useApp();

  const [step, setStep] = useState(1);
  const [layoutMode, setLayoutMode] = useState<TemplatePickerLayout>("grid");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
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


  
  const [draftHydrated, setDraftHydrated] = useState(false);
// Restore saved client project request draft once on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CLIENT_PROJECT_REQUEST_DRAFT_KEY);

      if (!raw) {
        setDraftHydrated(true);
        return;
      }

      const draft = JSON.parse(raw) as {
        step?: number;
        layoutMode?: TemplatePickerLayout;
        selectedTemplateId?: string;
        packageType?: PackageType;
        form?: Partial<typeof form>;
      };

      if (draft.step && draft.step >= 1 && draft.step <= 3) {
        setStep(draft.step);
      }

      if (draft.layoutMode) {
        setLayoutMode(draft.layoutMode);
      }

      if (draft.selectedTemplateId) {
        setSelectedTemplateId(draft.selectedTemplateId);
      }

      if (draft.packageType) {
        setPackageType(draft.packageType);
      }

      if (draft.form && typeof draft.form === "object") {
        setForm((current) => ({
          ...current,
          ...draft.form,
        }));
      }
    } catch {
      window.localStorage.removeItem(CLIENT_PROJECT_REQUEST_DRAFT_KEY);
    } finally {
      setDraftHydrated(true);
    }
  }, []);
  const packageOptions = useMemo(
    () => getTemplatePackageOptions(state.templates),
    [state.templates],
  );

  const selectedOption =
    packageOptions.find((option) => option.id === selectedTemplateId) ??
    packageOptions[0];

  const selectedPackage = getPackageCatalogItem(selectedOption?.type ?? packageType);

  const template =
    selectedOption?.template ??
    state.templates.find((item) => item.id === selectedTemplateId) ??
    state.templates.find((item) => item.packageType === packageType) ??
    null;

  useEffect(() => {
    if (!draftHydrated) return;

    if (!selectedTemplateId && packageOptions[0]) {
      setSelectedTemplateId(packageOptions[0].id);
      setPackageType(packageOptions[0].type);
    }
  }, [draftHydrated, packageOptions, selectedTemplateId]);

  function selectTemplate(option: TemplatePickerOption) {
    setSelectedTemplateId(option.id);
    setPackageType(option.type);
    setFormError("");
  }

  const displayPhases = useMemo(() => {
    if (template?.phases?.length) {
      return template.phases.map((phase, index) => {
        const fallback = selectedPackage.phases[index];
        const normalized = normalizeDeliverables((phase as any).deliverables);

        return {
          id: phase.id ?? `${packageType}-${index}`,
          title: phase.title || fallback?.title || `Phase ${index + 1}`,
          description:
            phase.description ||
            fallback?.description ||
            "Structured delivery phase prepared for client review.",
          deliverables:
            normalized.length > 0 ? normalized : fallback?.deliverables ?? [],
        };
      });
    }

    return [];
  }, [selectedPackage.phases, template]);

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


  // Save client project request draft so tab/page changes do not restart the wizard.
  useEffect(() => {
    if (!draftHydrated) return;

    try {
      window.localStorage.setItem(
        CLIENT_PROJECT_REQUEST_DRAFT_KEY,
        JSON.stringify({
          step,
          layoutMode,
          selectedTemplateId,
          packageType,
          form,
          updatedAt: new Date().toISOString(),
        }),
      );
    } catch {}
  }, [draftHydrated, step, layoutMode, selectedTemplateId, packageType, form]);
  function validateStep(targetStep = step) {
    if (targetStep !== 2 && targetStep !== 3) return "";

    if (!selectedOption?.template || !selectedTemplateId) {
      return "Select an admin-managed project template.";
    }

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
    const selectedTitle = selectedOption?.title || getPackageTitle(packageType);
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
        `Use the ${selectedTitle} workflow to ${outcome} for ${form.businessName || "the business"}.`,
      projectDescription:
        form.projectDescription ||
        `The project should be structured around ${selectedTitle}. Octalve should clarify the scope, define the delivery phases, prepare client-visible deliverables, manage approvals, and hand over the final outputs in a way that supports practical business use. Proposed delivery flow: ${phaseSummary}.`,
      additionalNotes:
        form.additionalNotes ||
        `Please align this request with the selected admin-managed template: ${selectedTitle}. The delivery should prioritize clarity, professional presentation, client review points, and measurable handoff outcomes.`,
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
        additionalNotes: [
          form.additionalNotes,
          selectedOption?.isLiveTemplate && selectedTemplateId
            ? `Selected admin template: ${template?.name || selectedOption?.title || selectedTemplateId} (${selectedTemplateId})`
            : "",
        ]
          .filter(Boolean)
          .join("\n\n"),
        packageType,
      });

      try {
        window.localStorage.removeItem(CLIENT_PROJECT_REQUEST_DRAFT_KEY);
      } catch {}

      window.location.href = "/client/projects";
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not submit project request.",
      );
    } finally {
      setLoading(false);
    }
  }

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
                Select an admin-managed delivery package, provide the project context, and Octalve will structure it into a clear workflow for review, execution and handoff.
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
            <TemplatePackagePicker
              templates={state.templates}
              selectedId={selectedTemplateId}
              onSelect={selectTemplate}
              role="client"
              layout={layoutMode}
              onLayoutChange={setLayoutMode}
              heading="Select Package / Suite"
              description="Choose the admin-managed delivery workflow that matches your project. Each option contains the phases and deliverables configured by Octalve."
            />

            <Card className="mt-6 overflow-hidden border-slate-200">
              <div className="border-b border-slate-200 bg-white px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Badge className={packageClass(packageType)}>
                      Selected Template
                    </Badge>
                    <h3 className="mt-3 text-xl font-semibold tracking-[-0.035em] text-slate-950">
                      {template?.name || selectedOption?.title || "No admin-managed template selected"}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      {template?.description || selectedOption?.description || "Create or select an admin-managed template before submitting this request."}
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
                  <Input
                    type="date"
                    className={inputClass}
                    value={form.preferredStartDate}
                    onChange={(event) =>
                      setForm({ ...form, preferredStartDate: event.target.value })
                    }
                  />
                </Field>

                <Field label="Target Delivery Date *">
                  <Input
                    type="date"
                    className={inputClass}
                    value={form.targetDeliveryDate}
                    onChange={(event) =>
                      setForm({ ...form, targetDeliveryDate: event.target.value })
                    }
                  />
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

                <div className="lg:col-span-2">
                  <Field label="Additional Notes">
                    <Textarea
                      className={textAreaClass}
                      value={form.additionalNotes}
                      onChange={(event) =>
                        setForm({ ...form, additionalNotes: event.target.value })
                      }
                      placeholder="Add useful links, existing assets, preferences, competitors or special instructions."
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-6 rounded-3xl bg-[#0064E0] p-4 text-white sm:flex sm:items-center sm:justify-between sm:gap-5">
                <div>
                  <Badge className="border-white/20 bg-white/15 text-white">
                    <Sparkles size={13} /> AI recommends {getPackageTitle(aiPackage)}
                  </Badge>
                  <p className="mt-2 text-sm font-medium leading-6 text-white/85">
                    Structure this brief around the selected template: {selectedOption?.title || getPackageTitle(packageType)}.
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
                <span>Selected Template</span>
                <strong>{selectedOption?.title || "No template selected"}</strong>
              </div>

              <div className="timeline-row">
                <span>Package</span>
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
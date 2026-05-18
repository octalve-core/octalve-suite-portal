"use client";

import { type CSSProperties, type ReactNode, useMemo, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Code2,
  Gem,
  Globe2,
  Handshake,
  HeartHandshake,
  Landmark,
  MonitorSmartphone,
  Palette,
  Rocket,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { type PackageType } from "@/lib/types";
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

type PackageOption = {
  type: PackageType;
  icon: ReactNode;
  color: string;
  title: string;
  category: string;
  description: string;
};

function packageTitle(packageType: PackageType | string) {
  const titles: Record<string, string> = {
    Launch: "Launch Suite",
    Impact: "Impact Suite",
    Growth: "Growth Suite",
    Partner: "Partner Suite",
    WebsiteStarter: "Website Dev. Starter",
    WebsiteProBiz: "Website Dev. Pro-Biz",
    WebsiteAdvance: "Website Dev. Advance",
    BrandingStarter: "Branding Starter",
    BrandingProBiz: "Branding Pro-Biz",
    BrandingAdvance: "Branding Advance",
    LeapRegistration: "Leap / Registration",
    Custom: "Custom",
  };

  return titles[String(packageType)] ?? String(packageType);
}

function recommendPackageLocal(text: string): PackageType {
  const value = text.toLowerCase();

  if (
    value.includes("cac") ||
    value.includes("registration") ||
    value.includes("register") ||
    value.includes("tin") ||
    value.includes("compliance") ||
    value.includes("licence") ||
    value.includes("license")
  ) {
    return "LeapRegistration";
  }

  if (
    value.includes("brand") ||
    value.includes("logo") ||
    value.includes("identity") ||
    value.includes("packaging")
  ) {
    return "BrandingProBiz";
  }

  if (
    value.includes("website") ||
    value.includes("web") ||
    value.includes("ecommerce") ||
    value.includes("e-commerce") ||
    value.includes("landing")
  ) {
    return "WebsiteProBiz";
  }

  if (
    value.includes("ngo") ||
    value.includes("foundation") ||
    value.includes("campaign") ||
    value.includes("donation") ||
    value.includes("impact")
  ) {
    return "Impact";
  }

  if (
    value.includes("growth") ||
    value.includes("automation") ||
    value.includes("sales") ||
    value.includes("crm") ||
    value.includes("system")
  ) {
    return "Growth";
  }

  return "Launch";
}

function improveBriefLocal(sourceText: string, businessName: string) {
  const cleanBusinessName = businessName.trim() || "the business";

  if (!sourceText.trim()) {
    return `Octalve should help ${cleanBusinessName} clarify the project objective, define the right execution scope, and deliver a professional digital solution that improves visibility, trust, customer action, and operational readiness.`;
  }

  return `Project context: ${sourceText.trim()}

Recommended direction: Octalve should translate this into a clear delivery scope with defined phases, client-visible deliverables, review points, and measurable outcomes.

Expected outcome: a professional solution that improves brand clarity, customer trust, digital presentation, conversion flow, and long-term business growth.`;
}

const packageOptions: PackageOption[] = [
  {
    type: "Launch",
    icon: <Rocket size={22} />,
    color: "#0064E0",
    title: "Launch Suite",
    category: "Suite",
    description:
      "For businesses preparing a professional launch, website rollout, brand presence, or customer-facing digital system.",
  },
  {
    type: "Impact",
    icon: <HeartHandshake size={22} />,
    color: "#E61525",
    title: "Impact Suite",
    category: "Suite",
    description:
      "For NGOs, campaigns, social initiatives, and mission-driven projects that need visibility, credibility, and donation readiness.",
  },
  {
    type: "Growth",
    icon: <TrendingUp size={22} />,
    color: "#29BE3E",
    title: "Growth Suite",
    category: "Suite",
    description:
      "For existing businesses that want stronger sales structure, automation, conversion flow, and digital growth systems.",
  },
  {
    type: "Partner",
    icon: <Handshake size={22} />,
    color: "#5300D9",
    title: "Partner Suite",
    category: "Suite",
    description:
      "For long-term execution support, strategic collaboration, managed project delivery, and continuous business improvement.",
  },
  {
    type: "WebsiteStarter",
    icon: <Globe2 size={22} />,
    color: "#0064E0",
    title: "Website Dev. Starter",
    category: "Website",
    description:
      "For a clean starter website or landing presence that helps a business look credible, clear, and ready for enquiries.",
  },
  {
    type: "WebsiteProBiz",
    icon: <MonitorSmartphone size={22} />,
    color: "#FC7E24",
    title: "Website Dev. Pro-Biz",
    category: "Website",
    description:
      "For a complete business website with stronger structure, conversion flow, content sections, and professional presentation.",
  },
  {
    type: "WebsiteAdvance",
    icon: <Code2 size={22} />,
    color: "#29BE3E",
    title: "Website Dev. Advance",
    category: "Website",
    description:
      "For advanced websites, e-commerce, landing pages, integrations, or custom digital experiences requiring deeper delivery.",
  },
  {
    type: "BrandingStarter",
    icon: <Palette size={22} />,
    color: "#E61525",
    title: "Branding Starter",
    category: "Branding",
    description:
      "For a clean starter identity covering logo, visual direction, brand guide, and essential business materials.",
  },
  {
    type: "BrandingProBiz",
    icon: <BadgeCheck size={22} />,
    color: "#FC7E24",
    title: "Branding Pro-Biz",
    category: "Branding",
    description:
      "For a stronger brand system with social assets, presentation materials, and more complete professional rollout.",
  },
  {
    type: "BrandingAdvance",
    icon: <Gem size={22} />,
    color: "#5300D9",
    title: "Branding Advance",
    category: "Branding",
    description:
      "For premium identity systems with deeper brand personality, packaging, brochure, signage, and wider applications.",
  },
  {
    type: "LeapRegistration",
    icon: <Landmark size={22} />,
    color: "#0064E0",
    title: "Leap / Registration",
    category: "Leap",
    description:
      "For business registration, CAC/TIN readiness, compliance support, licensing guidance, and founder setup structure.",
  },
  {
    type: "Custom",
    icon: <SlidersHorizontal size={22} />,
    color: "#5300D9",
    title: "Custom",
    category: "Custom",
    description:
      "For special projects that need a custom delivery structure, mixed services, or a scope outside a standard package.",
  },
];

export function ClientCreateProjectExpanded() {
  const { state, createProjectRequest } = useApp();

  const [step, setStep] = useState(1);
  const [packageType, setPackageType] = useState<PackageType>("Launch");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    projectName: "",
    businessName: "",
    preferredTimeline: "",
    projectGoal: "",
    projectDescription: "",
    additionalNotes: "",
  });

  const template =
    state.templates.find((template) => template.packageType === packageType) ??
    state.templates.find((template) => template.packageType === "Launch") ??
    state.templates[0];

  const aiPackage = useMemo(
    () => recommendPackageLocal(`${form.projectGoal} ${form.projectDescription}`),
    [form.projectGoal, form.projectDescription],
  );

  function validateStep(targetStep = step) {
    if (targetStep !== 2 && targetStep !== 3) return "";

    if (!form.projectName.trim()) return "Project name is required.";
    if (!form.businessName.trim()) return "Business or brand name is required.";
    if (!form.preferredTimeline.trim()) return "Preferred timeline is required.";
    if (!form.projectGoal.trim()) return "Project goal is required.";
    if (!form.projectDescription.trim()) return "Project description is required.";

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
    const sourceText = `${form.projectName} ${form.businessName} ${form.projectGoal} ${form.projectDescription}`.trim();

    const improvedBrief = improveBriefLocal(sourceText, form.businessName);

    setForm({
      ...form,
      projectGoal:
        form.projectGoal ||
        "Build a stronger digital presence that improves trust, communicates the offer clearly, and helps the business convert more serious customers.",
      projectDescription: form.projectDescription || improvedBrief,
      additionalNotes:
        form.additionalNotes ||
        `Recommended direction: ${packageTitle(aiPackage)}. Please align the execution around brand clarity, user experience, conversion flow, delivery accountability, and measurable business outcomes.`,
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
      await createProjectRequest({ ...form, packageType });
      window.location.href = "/client/projects";
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not submit project request.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content narrow">
      <div className="wizard">
        <BackLink href="/client/projects" label="Cancel" />

        <div className="wizard-head-premium">
          <Badge className="badge-blue">Step {step} of 3</Badge>
          <h1>Create Project Request</h1>
          <p>
            Share a clear project brief so Octalve can review your request, recommend the right structure, and convert it into a managed delivery workflow.
          </p>
        </div>

        <div className="wizard-progress">
          <span className={step >= 1 ? "active" : ""} />
          <span className={step >= 2 ? "active" : ""} />
          <span className={step >= 3 ? "active" : ""} />
        </div>

        {formError && <div className="project-form-error">{formError}</div>}

        {step === 1 && (
          <>
            <h2>Select Package / Suite</h2>

            <div className="grid-2-even">
              {packageOptions.map((option) => (
                <Card
                  key={option.type}
                  onClick={() => {
                    setPackageType(option.type);
                    setFormError("");
                  }}
                  className={`package-card premium-suite-card ${
                    packageType === option.type ? "selected" : ""
                  }`}
                  style={
                    {
                      "--suite-color": option.color,
                    } as CSSProperties
                  }
                >
                  <div className="package-icon premium-suite-icon">
                    {option.icon}
                  </div>

                  <div>
                    <span className="package-card-category">
                      {option.category}
                    </span>
                    <h3>{option.title}</h3>
                    <p>
                      {state.templates.find(
                        (template) => template.packageType === option.type,
                      )?.description || option.description}
                    </p>
                  </div>

                  {packageType === option.type && (
                    <span className="suite-selected-icon">
                      <CheckCircle2 size={18} />
                    </span>
                  )}
                </Card>
              ))}
            </div>

            {template && (
              <Card className="template-preview">
                <h3>{template.name}</h3>
                <p style={{ color: "var(--muted)" }}>{template.description}</p>
                <ol>
                  {template.phases?.slice(0, 5).map((phase, index) => (
                    <li key={phase.id ?? index}>{phase.title}</li>
                  ))}
                </ol>
              </Card>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <h2>Project Brief</h2>

            <Card className="card-body">
              <div className="form-grid">
                <Field label="Project Name *">
                  <Input
                    value={form.projectName}
                    onChange={(event) =>
                      setForm({ ...form, projectName: event.target.value })
                    }
                    placeholder="e.g. Premium website and launch system for my business"
                  />
                </Field>

                <Field label="Business / Brand Name *">
                  <Input
                    value={form.businessName}
                    onChange={(event) =>
                      setForm({ ...form, businessName: event.target.value })
                    }
                    placeholder="Enter the business, organization, or public brand name"
                  />
                </Field>

                <Field label="Preferred Timeline *">
                  <Input
                    value={form.preferredTimeline}
                    onChange={(event) =>
                      setForm({ ...form, preferredTimeline: event.target.value })
                    }
                    placeholder="e.g. 3 to 4 weeks, before launch day, or urgent"
                  />
                </Field>

                <Field label="Project Goal *">
                  <Textarea
                    value={form.projectGoal}
                    onChange={(event) =>
                      setForm({ ...form, projectGoal: event.target.value })
                    }
                    placeholder="What business outcome should this project achieve? Mention visibility, customer trust, sales, launch, automation, or operational improvement."
                  />
                </Field>

                <Field label="What should Octalve help you build or improve? *">
                  <Textarea
                    value={form.projectDescription}
                    onChange={(event) =>
                      setForm({ ...form, projectDescription: event.target.value })
                    }
                    placeholder="Describe the current challenge, expected deliverables, audience, references, pages/features needed, and what success should look like."
                  />
                </Field>

                <Field label="Additional Notes">
                  <Textarea
                    value={form.additionalNotes}
                    onChange={(event) =>
                      setForm({ ...form, additionalNotes: event.target.value })
                    }
                    placeholder="Add links, references, competitors, existing website/social pages, style preferences, or special instructions."
                  />
                </Field>
              </div>

              <div className="ai-brief-panel">
                <div>
                  <Badge className={packageClass(aiPackage)}>
                    <Sparkles size={13} /> AI recommends {packageTitle(aiPackage)}
                  </Badge>
                  <p>
                    Use this to turn rough notes into a clearer business-ready project brief before submission.
                  </p>
                </div>

                <Button variant="secondary" onClick={structureWithAI}>
                  <Sparkles size={16} /> Structure Brief
                </Button>
              </div>
            </Card>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Review & Submit</h2>

            <Card className="card-body stack">
              <div className="timeline-row">
                <span>Selected Package</span>
                <strong>{packageTitle(packageType)}</strong>
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
                <strong>{form.preferredTimeline || "Not provided"}</strong>
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

        <div className="wizard-actions">
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
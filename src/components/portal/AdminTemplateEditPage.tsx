"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Layers3,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";

import type { PackageType, ProjectTemplate } from "@/lib/types";
import {
  PACKAGE_CATALOG,
  getPackageCatalogItem,
  getPackagePhases,
} from "./packageCatalog";
import { useApp } from "./AppContext";
import { Badge, Button, Card, Field, Input, Select, Textarea, packageClass } from "./UI";

type TemplatePhaseForm = {
  title: string;
  description: string;
  deliverablesText: string;
};

type TemplateForm = {
  name: string;
  packageType: PackageType;
  description: string;
  phases: TemplatePhaseForm[];
};

const EMPTY_PHASE: TemplatePhaseForm = {
  title: "",
  description: "",
  deliverablesText: "",
};

function getTemplateIdParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function templateToForm(template: ProjectTemplate): TemplateForm {
  return {
    name: template.name,
    packageType: template.packageType,
    description: template.description,
    phases: template.phases?.length
      ? template.phases.map((phase) => ({
          title: phase.title,
          description: phase.description ?? "",
          deliverablesText: (phase.deliverables ?? []).join("\n"),
        }))
      : [{ ...EMPTY_PHASE }],
  };
}

function catalogToForm(packageType: PackageType): TemplateForm {
  const item = getPackageCatalogItem(packageType);

  return {
    name: item.title,
    packageType,
    description: item.description,
    phases: item.phases.map((phase) => ({
      title: phase.title,
      description: phase.description,
      deliverablesText: phase.deliverables.map((deliverable) => deliverable.title).join("\n"),
    })),
  };
}

function formToPayload(form: TemplateForm) {
  return {
    name: form.name.trim(),
    packageType: form.packageType,
    description: form.description.trim(),
    phases: form.phases
      .map((phase) => ({
        title: phase.title.trim(),
        description: phase.description.trim(),
        deliverables: phase.deliverablesText
          .split(/\r?\n|,/)
          .map((item) => item.trim())
          .filter(Boolean),
      }))
      .filter((phase) => phase.title || phase.description || phase.deliverables.length),
  };
}

export function AdminTemplateEditPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = getTemplateIdParam(params?.templateId);

  const { state, updateTemplate, refresh } = useApp();

  const template = useMemo(
    () => state.templates.find((item) => item.id === templateId) ?? null,
    [state.templates, templateId],
  );

  const [form, setForm] = useState<TemplateForm>(() =>
    template ? templateToForm(template) : catalogToForm("Launch"),
  );
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const selectedCatalog = getPackageCatalogItem(form.packageType);

  const totalDeliverables = form.phases.reduce(
    (total, phase) =>
      total +
      phase.deliverablesText
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean).length,
    0,
  );

  useEffect(() => {
    if (template) {
      setForm(templateToForm(template));
    }
  }, [template]);

  function updatePhase(index: number, patch: Partial<TemplatePhaseForm>) {
    setForm((current) => ({
      ...current,
      phases: current.phases.map((phase, phaseIndex) =>
        phaseIndex === index ? { ...phase, ...patch } : phase,
      ),
    }));
  }

  function addPhase() {
    setForm((current) => ({
      ...current,
      phases: [...current.phases, { ...EMPTY_PHASE }],
    }));
  }

  function removePhase(index: number) {
    setForm((current) => ({
      ...current,
      phases:
        current.phases.length > 1
          ? current.phases.filter((_, phaseIndex) => phaseIndex !== index)
          : current.phases,
    }));
  }

  function applyCatalogWorkflow() {
    const phases = getPackagePhases(form.packageType).map((phase) => ({
      title: phase.title,
      description: phase.description,
      deliverablesText: phase.deliverables
        .map((deliverable) => deliverable.title)
        .join("\n"),
    }));

    setForm((current) => ({
      ...current,
      name: current.name.trim() || selectedCatalog.title,
      description: current.description.trim() || selectedCatalog.description,
      phases,
    }));

    setNotice("Default workflow applied. Review and adjust before saving.");
    setError("");
  }

  function duplicatePhase(index: number) {
    setForm((current) => ({
      ...current,
      phases: [
        ...current.phases.slice(0, index + 1),
        {
          ...current.phases[index],
          title: `${current.phases[index].title || "Phase"} Copy`,
        },
        ...current.phases.slice(index + 1),
      ],
    }));
  }

  async function saveTemplate() {
    const payload = formToPayload(form);

    if (!payload.name) {
      setError("Template name is required.");
      return;
    }

    if (!payload.description) {
      setError("Template description is required.");
      return;
    }

    if (!payload.phases.length) {
      setError("Add at least one delivery phase.");
      return;
    }

    if (payload.phases.some((phase) => !phase.title)) {
      setError("Every phase must have a title.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      await updateTemplate(templateId, payload as any);
      await refresh();
      setNotice("Template updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update template.");
    } finally {
      setLoading(false);
    }
  }

  if (!template && state.templates.length > 0) {
    return (
      <div className="content narrow">
        <Card className="border-slate-200 bg-white p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <Badge className="badge-red">Template not found</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
            This template could not be opened
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            It may have been deleted or the link may no longer be valid.
          </p>
          <div className="mt-6">
            <Button onClick={() => router.push("/admin/templates")}>
              Back to Templates
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="content narrow">
      <div className="mx-auto max-w-[1180px] pb-10">
        <button
          type="button"
          onClick={() => router.push("/admin/templates")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#0064E0]"
        >
          <ArrowLeft size={16} />
          Back to templates
        </button>

        <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="bg-[#E61525] px-6 py-7 text-white sm:px-8 lg:px-10">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <Badge className="border-white/20 bg-white/15 text-white">
                  Template editor
                </Badge>
                <h1 className="mt-4 max-w-3xl text-[34px] font-semibold leading-[1.02] tracking-[-0.055em] sm:text-[46px]">
                  Edit project template
                </h1>
                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/82 sm:text-[15px]">
                  Manage the package type, delivery phases and client-visible deliverables used to structure Octalve projects.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/12 px-4 py-3">
                  <span className="block text-[11px] font-black uppercase tracking-[0.1em] text-white/65">
                    Package
                  </span>
                  <strong className="mt-1 block text-sm">{selectedCatalog.shortTitle}</strong>
                </div>
                <div className="rounded-2xl bg-white/12 px-4 py-3">
                  <span className="block text-[11px] font-black uppercase tracking-[0.1em] text-white/65">
                    Phases
                  </span>
                  <strong className="mt-1 block text-sm">{form.phases.length}</strong>
                </div>
                <div className="rounded-2xl bg-white/12 px-4 py-3">
                  <span className="block text-[11px] font-black uppercase tracking-[0.1em] text-white/65">
                    Deliverables
                  </span>
                  <strong className="mt-1 block text-sm">{totalDeliverables}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:p-8">
            <aside className="space-y-5">
              <Card className="border-slate-200 bg-white p-5 shadow-none">
                <div className="mb-4 flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-[#E61525]">
                    <Layers3 size={19} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold tracking-[-0.03em] text-slate-950">
                      Template details
                    </h2>
                    <p className="text-xs font-medium text-slate-500">
                      Core package identity
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Field label="Template name">
                    <Input
                      value={form.name}
                      disabled={loading}
                      onChange={(event) =>
                        setForm({ ...form, name: event.target.value })
                      }
                      placeholder="e.g. Launch Suite Delivery Workflow"
                      className="h-12 rounded-2xl border-slate-200 text-sm placeholder:text-slate-400"
                    />
                  </Field>

                  <Field label="Package / Suite">
                    <Select
                      value={form.packageType}
                      disabled={loading}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          packageType: event.target.value as PackageType,
                        })
                      }
                      className="h-12 rounded-2xl border-slate-200 text-sm"
                    >
                      {PACKAGE_CATALOG.map((item) => (
                        <option key={item.type} value={item.type}>
                          {item.title}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Description">
                    <Textarea
                      value={form.description}
                      disabled={loading}
                      onChange={(event) =>
                        setForm({ ...form, description: event.target.value })
                      }
                      placeholder="Explain when this template should be used and what outcome it supports."
                      className="min-h-[120px] rounded-2xl border-slate-200 text-sm placeholder:text-slate-400"
                    />
                  </Field>
                </div>

                <div className="mt-5 grid gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={applyCatalogWorkflow}
                    disabled={loading}
                    className="w-full justify-center"
                  >
                    <Sparkles size={16} />
                    Apply default workflow
                  </Button>

                  <Button
                    type="button"
                    loading={loading}
                    onClick={saveTemplate}
                    className="w-full justify-center"
                  >
                    <Save size={16} />
                    Save template
                  </Button>
                </div>

                {notice && (
                  <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    {notice}
                  </p>
                )}

                {error && (
                  <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                  </p>
                )}
              </Card>
            </aside>

            <main className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Badge className={packageClass(form.packageType)}>
                    {selectedCatalog.title}
                  </Badge>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    Delivery phases
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Build the workflow clients and delivery teams will follow after a project is approved.
                  </p>
                </div>

                <Button type="button" variant="secondary" onClick={addPhase} disabled={loading}>
                  <Plus size={16} />
                  Add Phase
                </Button>
              </div>

              <div className="space-y-4">
                {form.phases.map((phase, index) => {
                  const deliverableCount = phase.deliverablesText
                    .split(/\r?\n|,/)
                    .map((item) => item.trim())
                    .filter(Boolean).length;

                  return (
                    <Card
                      key={index}
                      className="border-slate-200 bg-white p-5 shadow-[0_16px_42px_rgba(15,23,42,0.06)]"
                    >
                      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-sm font-black text-slate-700">
                            {index + 1}
                          </span>
                          <div>
                            <h3 className="text-lg font-semibold tracking-[-0.035em] text-slate-950">
                              Phase {index + 1}
                            </h3>
                            <p className="text-xs font-semibold text-slate-500">
                              {deliverableCount} deliverables
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={loading}
                            onClick={() => duplicatePhase(index)}
                          >
                            <Copy size={15} />
                            Duplicate
                          </Button>

                          <Button
                            type="button"
                            variant="danger"
                            disabled={loading || form.phases.length <= 1}
                            onClick={() => removePhase(index)}
                          >
                            <Trash2 size={15} />
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <Field label="Phase title">
                          <Input
                            value={phase.title}
                            disabled={loading}
                            onChange={(event) =>
                              updatePhase(index, { title: event.target.value })
                            }
                            placeholder="e.g. Discovery & Direction"
                            className="h-12 rounded-2xl border-slate-200 text-sm placeholder:text-slate-400"
                          />
                        </Field>

                        <Field label="Phase description">
                          <Input
                            value={phase.description}
                            disabled={loading}
                            onChange={(event) =>
                              updatePhase(index, {
                                description: event.target.value,
                              })
                            }
                            placeholder="Explain what happens in this phase."
                            className="h-12 rounded-2xl border-slate-200 text-sm placeholder:text-slate-400"
                          />
                        </Field>

                        <div className="lg:col-span-2">
                          <Field label="Deliverables">
                            <Textarea
                              value={phase.deliverablesText}
                              disabled={loading}
                              onChange={(event) =>
                                updatePhase(index, {
                                  deliverablesText: event.target.value,
                                })
                              }
                              placeholder={"One deliverable per line\nProject brief\nWebsite preview\nFinal handoff note"}
                              className="min-h-[128px] rounded-2xl border-slate-200 text-sm placeholder:text-slate-400"
                            />
                          </Field>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </main>
          </div>
        </section>
      </div>
    </div>
  );
}
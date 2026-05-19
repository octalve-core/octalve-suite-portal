"use client";


import { PACKAGE_CATALOG } from "./packageCatalog";
import { useMemo, useState } from "react";
import { Copy, LayoutTemplate, Pencil, Plus, Trash2 } from "lucide-react";
import type { PackageType, ProjectTemplate } from "@/lib/types";
import { useApp } from "./AppContext";
import { Badge, Button, Card, Input, Textarea, packageClass } from "./UI";
import {
  WorkspaceActionCard,
  WorkspaceEmptyPanel,
  WorkspaceListIcons,
  WorkspaceListPanel,
  WorkspaceSectionHero,
  WorkspaceStatStrip,
} from "./WorkspaceLists";

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

const PACKAGE_OPTIONS: PackageType[] = ["Launch", "Impact", "Growth", "Partner", "Custom"];

const EMPTY_PHASE: TemplatePhaseForm = {
  title: "",
  description: "",
  deliverablesText: "",
};

const EMPTY_FORM: TemplateForm = {
  name: "",
  packageType: "Launch",
  description: "",
  phases: [
    {
      title: "Discovery & Strategy",
      description: "Clarify requirements, goals, stakeholders, and delivery direction.",
      deliverablesText: "Project brief\nDelivery roadmap",
    },
    {
      title: "Design & Structure",
      description: "Prepare the core structure, assets, and approved direction.",
      deliverablesText: "Design direction\nContent structure",
    },
    {
      title: "Build & Delivery",
      description: "Execute the core project deliverables and prepare review links.",
      deliverablesText: "Working preview\nDelivery files",
    },
  ],
};

function templateToForm(template: ProjectTemplate): TemplateForm {
  return {
    name: template.name,
    packageType: template.packageType,
    description: template.description,
    phases: template.phases.length
      ? template.phases.map((phase) => ({
          title: phase.title,
          description: phase.description ?? "",
          deliverablesText: (phase.deliverables ?? []).join("\n"),
        }))
      : [{ ...EMPTY_PHASE }],
  };
}

function formToPayload(form: TemplateForm) {
  return {
    name: form.name.trim(),
    packageType: form.packageType,
    description: form.description.trim(),
    phases: form.phases
      .filter((phase) => phase.title.trim())
      .map((phase) => ({
        title: phase.title.trim(),
        description: phase.description.trim(),
        deliverables: phase.deliverablesText
          .split(/\r?\n|,/)
          .map((item) => item.trim())
          .filter(Boolean),
      })),
  };
}

export function AdminTemplatesManager() {
  const { state, createTemplate, updateTemplate, deleteTemplate, refresh } = useApp();

  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const editingTemplate = state.templates.find((template) => template.id === editingId) ?? null;

  const packageCounts = useMemo(() => {
    return PACKAGE_OPTIONS.map((packageType) => ({
      packageType,
      count: state.templates.filter((template) => template.packageType === packageType).length,
    }));
  }, [state.templates]);

  const totalPhases = state.templates.reduce(
    (total, template) => total + template.phases.length,
    0,
  );

  function resetForm() {
    setMode("create");
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  function editTemplate(template: ProjectTemplate) {
    setMode("edit");
    setEditingId(template.id);
    setForm(templateToForm(template));
    setError("");
  }

  function duplicateTemplate(template: ProjectTemplate) {
    setMode("create");
    setEditingId(null);
    setForm({
      ...templateToForm(template),
      name: `${template.name} Copy`,
    });
    setError("");
  }

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
      setError("Add at least one phase.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (mode === "edit" && editingId) {
        await updateTemplate(editingId, payload as any);
      } else {
        await createTemplate(payload as any);
      }

      await refresh();
      resetForm();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save template.");
    } finally {
      setLoading(false);
    }
  }

  async function removeTemplate(template: ProjectTemplate) {
    const ok = confirm(`Delete "${template.name}"? This cannot be undone.`);

    if (!ok) return;

    setLoading(true);
    setError("");

    try {
      await deleteTemplate(template.id);
      await refresh();

      if (editingId === template.id) {
        resetForm();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to delete template.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content">
      <WorkspaceSectionHero
        eyebrow="Delivery Systems"
        title="Templates"
        subtitle="Create, edit, duplicate, and delete reusable project templates for Octalve Suite delivery."
        action={
          <Button variant="secondary" onClick={resetForm}>
            <Plus size={16} />
            New Template
          </Button>
        }
        meta={
          <>
            <Badge className="badge-blue">{state.templates.length} Templates</Badge>
            <Badge className="badge-purple">{totalPhases} Phases</Badge>
          </>
        }
      />

      <WorkspaceStatStrip
        items={[
          {
            label: "Templates",
            value: state.templates.length,
            tone: "blue",
            icon: WorkspaceListIcons.template,
          },
          {
            label: "Reusable Phases",
            value: totalPhases,
            tone: "purple",
            icon: <LayoutTemplate size={18} />,
          },
          {
            label: "Launch Templates",
            value: packageCounts.find((item) => item.packageType === "Launch")?.count ?? 0,
            tone: "green",
            icon: WorkspaceListIcons.check,
          },
          {
            label: "Custom Templates",
            value: packageCounts.find((item) => item.packageType === "Custom")?.count ?? 0,
            tone: "orange",
            icon: WorkspaceListIcons.document,
          },
        ]}
      />

      <div className="grid-2">
        <WorkspaceListPanel
          title="Template Library"
          subtitle="Select a template to edit or duplicate it."
        >
          {state.templates.length ? (
            state.templates.map((template) => (
              <WorkspaceActionCard
                key={template.id}
                title={template.name}
                subtitle={template.description}
                icon={WorkspaceListIcons.template}
                tone="blue"
                badge={
                  <Badge className={packageClass(template.packageType)}>
                    {template.packageType}
                  </Badge>
                }
                meta={
                  <>
                    <span>{template.phases.length} phases</span>
                    <span>
                      {template.phases.reduce(
                        (total, phase) => total + (phase.deliverables?.length ?? 0),
                        0,
                      )} deliverables
                    </span>
                  </>
                }
                action={
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Button variant="secondary" onClick={() => editTemplate(template)}>
                      <Pencil size={15} />
                      Edit
                    </Button>
                    <Button variant="secondary" onClick={() => duplicateTemplate(template)}>
                      <Copy size={15} />
                      Copy
                    </Button>
                    <Button variant="secondary" onClick={() => removeTemplate(template)}>
                      <Trash2 size={15} />
                      Delete
                    </Button>
                  </div>
                }
              />
            ))
          ) : (
            <WorkspaceEmptyPanel
              title="No templates yet"
              body="Create your first reusable delivery template."
              icon={WorkspaceListIcons.template}
            />
          )}
        </WorkspaceListPanel>

        <Card className="workspace-list-panel">
          <div className="workspace-list-panel-head">
            <div>
              <h2>{mode === "edit" ? "Edit Template" : "Create Template"}</h2>
              <p>
                {editingTemplate
                  ? `Editing ${editingTemplate.name}`
                  : "Build a reusable delivery structure."}
              </p>
            </div>
          </div>

          <div className="workspace-list-panel-body">
            <div className="stack">
              <div className="grid-2">
                <label className="field">
                  <span>Template Name</span>
                  <Input
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="e.g. Launch Suite Website"
                  />
                </label>

                <label className="field">
                  <span>Package Type</span>
                  <select
                    className="input"
                    value={form.packageType}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        packageType: event.target.value as PackageType,
                      })
                    }
                  >
                    {PACKAGE_OPTIONS.map((packageType) => (
                      <option key={packageType} value={packageType}>
                        {packageType}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="field">
                <span>Description</span>
                <Textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="Explain what this template is used for..."
                />
              </label>

              <div className="stack">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <strong style={{ color: "var(--text)", fontWeight: 600 }}>
                      Phases
                    </strong>
                    <p style={{ color: "var(--muted)", margin: "4px 0 0" }}>
                      Define the delivery stages and expected deliverables.
                    </p>
                  </div>

                  <Button variant="secondary" onClick={addPhase}>
                    <Plus size={15} />
                    Add Phase
                  </Button>
                </div>

                {form.phases.map((phase, index) => (
                  <Card key={index} className="card-body">
                    <div className="stack">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <Badge className="badge-blue">Phase {index + 1}</Badge>

                        <Button
                          variant="secondary"
                          onClick={() => removePhase(index)}
                          disabled={form.phases.length <= 1}
                        >
                          Remove
                        </Button>
                      </div>

                      <label className="field">
                        <span>Phase Title</span>
                        <Input
                          value={phase.title}
                          onChange={(event) =>
                            updatePhase(index, { title: event.target.value })
                          }
                          placeholder="e.g. Discovery & Strategy"
                        />
                      </label>

                      <label className="field">
                        <span>Phase Description</span>
                        <Textarea
                          value={phase.description}
                          onChange={(event) =>
                            updatePhase(index, { description: event.target.value })
                          }
                          placeholder="Describe the phase..."
                        />
                      </label>

                      <label className="field">
                        <span>Deliverables</span>
                        <Textarea
                          value={phase.deliverablesText}
                          onChange={(event) =>
                            updatePhase(index, {
                              deliverablesText: event.target.value,
                            })
                          }
                          placeholder={"One deliverable per line\nWebsite preview\nContent draft"}
                        />
                      </label>
                    </div>
                  </Card>
                ))}
              </div>

              {error && <p className="form-error">{error}</p>}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button loading={loading} onClick={saveTemplate}>
                  {mode === "edit" ? "Save Changes" : "Create Template"}
                </Button>

                <Button variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

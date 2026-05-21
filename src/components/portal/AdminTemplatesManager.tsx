"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Copy,
  Layers3,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import type { ProjectTemplate } from "@/lib/types";
import { PACKAGE_CATALOG, getPackageCatalogItem } from "./packageCatalog";
import { useApp } from "./AppContext";
import { Badge, Button, Card } from "./UI";

function catalogIndex(packageType: string) {
  return PACKAGE_CATALOG.findIndex((item) => item.type === packageType);
}

function catalogPayload(item: (typeof PACKAGE_CATALOG)[number]) {
  const order = PACKAGE_CATALOG.findIndex((catalogItem) => catalogItem.type === item.type);

  return {
    name: item.title,
    packageType: item.type,
    slug: item.type,
    category: item.category,
    color: item.color,
    iconKey: item.type,
    sortOrder: order >= 0 ? order + 1 : 999,
    isOfficial: true,
    isActive: true,
    description: item.description,
    phases: item.phases.map((phase) => ({
      title: phase.title,
      description: phase.description,
      deliverables: phase.deliverables.map((deliverable) => deliverable.title),
    })),
  };
}

function countDeliverables(template: ProjectTemplate) {
  return template.phases.reduce(
    (total, phase) => total + (phase.deliverables?.length ?? 0),
    0,
  );
}

function templatePayload(template: ProjectTemplate, patch: Partial<ProjectTemplate> = {}) {
  return {
    name: patch.name ?? template.name,
    packageType: patch.packageType ?? template.packageType,
    slug: patch.slug ?? template.slug ?? null,
    category: patch.category ?? template.category ?? "Custom",
    color: patch.color ?? template.color ?? "#5300D9",
    iconKey: patch.iconKey ?? template.iconKey ?? template.packageType,
    sortOrder: patch.sortOrder ?? template.sortOrder ?? 999,
    isOfficial: patch.isOfficial ?? template.isOfficial ?? false,
    isActive: patch.isActive ?? template.isActive ?? true,
    description: patch.description ?? template.description,
    phases: template.phases.map((phase) => ({
      title: phase.title,
      description: phase.description ?? "",
      deliverables: phase.deliverables ?? [],
    })),
  };
}

function needsOfficialMetadataBackfill(template: ProjectTemplate) {
  if (template.packageType === "Custom") return false;

  const catalog = getPackageCatalogItem(template.packageType);
  const order = catalogIndex(template.packageType);

  return (
    template.slug !== template.packageType ||
    template.category !== catalog.category ||
    template.color !== catalog.color ||
    template.iconKey !== template.packageType ||
    template.sortOrder !== (order >= 0 ? order + 1 : 999) ||
    template.isOfficial !== true
  );
}

export function AdminTemplatesManager() {
  const {
    state,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refresh,
  } = useApp();

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const activeTemplates = state.templates.filter((template) => template.isActive !== false);
  const inactiveTemplates = state.templates.length - activeTemplates.length;
  const officialTemplates = state.templates.filter((template) => template.isOfficial === true);

  const totalPhases = state.templates.reduce(
    (total, template) => total + template.phases.length,
    0,
  );

  const totalDeliverables = state.templates.reduce(
    (total, template) => total + countDeliverables(template),
    0,
  );

  const catalogCoverage = useMemo(() => {
    return PACKAGE_CATALOG.filter((item) =>
      state.templates.some((template) => template.packageType === item.type),
    ).length;
  }, [state.templates]);

  const missingCatalogItems = useMemo(() => {
    const existingTypes = new Set(
      state.templates.map((template) => template.packageType),
    );

    return PACKAGE_CATALOG.filter((item) => !existingTypes.has(item.type));
  }, [state.templates]);

  const metadataBackfillTemplates = useMemo(() => {
    return state.templates.filter(needsOfficialMetadataBackfill);
  }, [state.templates]);

  const canCreateMissingTemplates = missingCatalogItems.length > 0;
  const canBackfillMetadata = metadataBackfillTemplates.length > 0;

  async function createMissingOfficialTemplates() {
    if (!missingCatalogItems.length) {
      setNotice("All official Octalve package templates are already admin-managed.");
      setError("");
      return;
    }

    const ok = window.confirm(
      `Create ${missingCatalogItems.length} missing official Octalve template${missingCatalogItems.length === 1 ? "" : "s"}? Existing templates will not be changed.`,
    );

    if (!ok) return;

    setLoadingAction("sync");
    setNotice("");
    setError("");

    try {
      for (const item of missingCatalogItems) {
        await createTemplate(catalogPayload(item) as any);
      }

      await refresh();
      setNotice(
        `${missingCatalogItems.length} missing official template${missingCatalogItems.length === 1 ? "" : "s"} created successfully. Existing templates were not overwritten.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create missing official templates.",
      );
    } finally {
      setLoadingAction(null);
    }
  }

  async function backfillOfficialTemplateMetadata() {
    if (!metadataBackfillTemplates.length) {
      setNotice("Official template metadata is already up to date.");
      setError("");
      return;
    }

    const ok = window.confirm(
      `Backfill metadata for ${metadataBackfillTemplates.length} official template${metadataBackfillTemplates.length === 1 ? "" : "s"}? Phases and deliverables will be preserved.`,
    );

    if (!ok) return;

    setLoadingAction("metadata");
    setNotice("");
    setError("");

    try {
      for (const template of metadataBackfillTemplates) {
        const catalog = getPackageCatalogItem(template.packageType);
        const order = catalogIndex(template.packageType);

        await updateTemplate(
          template.id,
          templatePayload(template, {
            slug: template.packageType,
            category: catalog.category,
            color: catalog.color,
            iconKey: template.packageType,
            sortOrder: order >= 0 ? order + 1 : 999,
            isOfficial: true,
            isActive: template.isActive !== false,
          }) as any,
        );
      }

      await refresh();
      setNotice("Official template metadata backfilled successfully. Existing phases and deliverables were preserved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not backfill official template metadata.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function duplicateTemplate(template: ProjectTemplate) {
    setLoadingAction(`copy-${template.id}`);
    setNotice("");
    setError("");

    try {
      await createTemplate({
        ...templatePayload(template, {
          name: `${template.name} Copy`,
          slug: template.slug ? `${template.slug}-copy` : undefined,
          isOfficial: false,
          sortOrder: (template.sortOrder ?? 999) + 1000,
        }),
      } as any);

      await refresh();
      setNotice(`"${template.name}" duplicated successfully.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not duplicate template.",
      );
    } finally {
      setLoadingAction(null);
    }
  }

  async function removeTemplate(template: ProjectTemplate) {
    const ok = window.confirm(
      `Delete "${template.name}"? This will remove it from the client package selection immediately.`,
    );

    if (!ok) return;

    setLoadingAction(`delete-${template.id}`);
    setNotice("");
    setError("");

    try {
      await deleteTemplate(template.id);
      await refresh();
      setNotice(`"${template.name}" deleted successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete template.");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="content narrow">
      <div className="mx-auto max-w-310 pb-10">
        <section className="relative overflow-hidden rounded-[30px] bg-[#E61525] px-6 py-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/14" />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <Badge className="border-white/20 bg-white/15 text-white">
                Delivery Systems
              </Badge>
              <h1 className="mt-4 max-w-3xl text-[34px] font-semibold leading-[1.02] tracking-[-0.055em] sm:text-[48px]">
                Templates
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/82 sm:text-[15px]">
                Manage database-backed delivery workflows. Only templates created here appear for clients.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-xs font-bold text-white">
                  {state.templates.length} total
                </span>
                <span className="rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-xs font-bold text-white">
                  {activeTemplates.length} active
                </span>
                <span className="rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-xs font-bold text-white">
                  {inactiveTemplates} inactive
                </span>
                <span className="rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-xs font-bold text-white">
                  {catalogCoverage}/{PACKAGE_CATALOG.length} official coverage
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              {canBackfillMetadata ? (
                <Button
                  type="button"
                  variant="secondary"
                  loading={loadingAction === "metadata"}
                  onClick={backfillOfficialTemplateMetadata}
                  className="bg-white text-[#E61525]"
                >
                  <RefreshCw size={16} />
                  Backfill Metadata
                </Button>
              ) : null}

              {canCreateMissingTemplates ? (
                <Button
                  type="button"
                  variant="secondary"
                  loading={loadingAction === "sync"}
                  onClick={createMissingOfficialTemplates}
                  className="bg-white text-[#E61525]"
                >
                  <RefreshCw size={16} />
                  Create Missing Templates
                </Button>
              ) : null}

              <Link href="/admin/templates/new">
                <Button className="bg-white text-[#E61525]">
                  <Plus size={16} />
                  New Template
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {notice && (
          <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {notice}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-slate-200 bg-white p-5 shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-[#0064E0]">
              <Layers3 size={18} />
            </span>
            <strong className="mt-4 block text-3xl tracking-tighter text-slate-950">
              {state.templates.length}
            </strong>
            <span className="text-sm font-semibold text-slate-500">
              Templates
            </span>
          </Card>

          <Card className="border-slate-200 bg-white p-5 shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-50 text-[#5300D9]">
              <Layers3 size={18} />
            </span>
            <strong className="mt-4 block text-3xl tracking-tighter text-slate-950">
              {officialTemplates.length}
            </strong>
            <span className="text-sm font-semibold text-slate-500">
              Official templates
            </span>
          </Card>

          <Card className="border-slate-200 bg-white p-5 shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-[#29BE3E]">
              <Layers3 size={18} />
            </span>
            <strong className="mt-4 block text-3xl tracking-tighter text-slate-950">
              {totalDeliverables}
            </strong>
            <span className="text-sm font-semibold text-slate-500">
              Deliverables
            </span>
          </Card>

          <Card className="border-slate-200 bg-white p-5 shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-50 text-[#FC7E24]">
              <Layers3 size={18} />
            </span>
            <strong className="mt-4 block text-3xl tracking-tighter text-slate-950">
              {catalogCoverage}/{PACKAGE_CATALOG.length}
            </strong>
            <span className="text-sm font-semibold text-slate-500">
              Official coverage
            </span>
          </Card>
        </div>

        <Card className="mt-6 overflow-hidden border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
                  Template Library
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Every active template here is available to clients. Deleted or inactive templates disappear from client selection.
                </p>
              </div>

              <Link href="/admin/templates/new">
                <Button>
                  <Plus size={16} />
                  New Template
                </Button>
              </Link>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {state.templates.length ? (
              [...state.templates]
                .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name.localeCompare(b.name))
                .map((template) => {
                  const catalog = getPackageCatalogItem(template.packageType);
                  const deliverables = countDeliverables(template);
                  const color = template.color || catalog.color;
                  const category = template.category || catalog.category;

                  return (
                    <div
                      key={template.id}
                      className="grid gap-4 px-5 py-5 transition hover:bg-slate-50 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
                    >
                      <div className="flex min-w-0 gap-4">
                        <span
                          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
                          style={{
                            backgroundColor: `${color}14`,
                            color,
                          }}
                        >
                          <Layers3 size={19} />
                        </span>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold tracking-[-0.03em] text-slate-950">
                              {template.name}
                            </h3>

                            <span
                              className="rounded-full px-2.5 py-1 text-[11px] font-black"
                              style={{
                                backgroundColor: `${color}14`,
                                color,
                              }}
                            >
                              {category}
                            </span>

                            {template.isOfficial ? (
                              <Badge className="badge-blue">Official</Badge>
                            ) : (
                              <Badge className="badge-slate">Custom</Badge>
                            )}

                            {template.isActive === false ? (
                              <Badge className="badge-orange">Inactive</Badge>
                            ) : (
                              <Badge className="badge-green">Active</Badge>
                            )}
                          </div>

                          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                            {template.description || catalog.description}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                            <span>{template.phases.length} phases</span>
                            <span>{deliverables} deliverables</span>
                            <span>Sort {template.sortOrder ?? 999}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <Link href={`/admin/templates/${template.id}`}>
                          <Button variant="secondary">
                            <Pencil size={15} />
                            Edit
                          </Button>
                        </Link>

                        <Button
                          variant="secondary"
                          loading={loadingAction === `copy-${template.id}`}
                          onClick={() => duplicateTemplate(template)}
                        >
                          <Copy size={15} />
                          Copy
                        </Button>

                        <Button
                          variant="danger"
                          loading={loadingAction === `delete-${template.id}`}
                          onClick={() => removeTemplate(template)}
                        >
                          <Trash2 size={15} />
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-[#0064E0]">
                  <Layers3 size={22} />
                </div>
                <h3 className="mt-4 text-xl font-semibold tracking-[-0.04em] text-slate-950">
                  No templates yet
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                  Create the missing official Octalve templates or add a custom delivery workflow.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  {canCreateMissingTemplates ? (
                    <Button
                      variant="secondary"
                      loading={loadingAction === "sync"}
                      onClick={createMissingOfficialTemplates}
                    >
                      <RefreshCw size={16} />
                      Create Missing Templates
                    </Button>
                  ) : null}

                  <Link href="/admin/templates/new">
                    <Button>
                      <Plus size={16} />
                      New Template
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
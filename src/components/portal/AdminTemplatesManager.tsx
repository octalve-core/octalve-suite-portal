"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Copy,
  ExternalLink,
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

function catalogPayload(item: (typeof PACKAGE_CATALOG)[number]) {
  return {
    name: item.title,
    packageType: item.type,
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

  
  const canSyncDefaultTemplates = process.env.NODE_ENV !== "production";
async function syncDefaultTemplates() {
    const ok = window.confirm(
      "Sync the official Octalve package workflows? This will create missing templates and update existing package templates with the latest phases and deliverables.",
    );

    if (!ok) return;

    setLoadingAction("sync");
    setNotice("");
    setError("");

    try {
      for (const item of PACKAGE_CATALOG) {
        const existing = state.templates.find(
          (template) => template.packageType === item.type,
        );

        const payload = catalogPayload(item);

        if (existing) {
          await updateTemplate(existing.id, payload as any);
        } else {
          await createTemplate(payload as any);
        }
      }

      await refresh();
      setNotice("Official Octalve package templates synced successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not sync default templates.",
      );
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
        name: `${template.name} Copy`,
        packageType: template.packageType,
        description: template.description,
        phases: template.phases.map((phase) => ({
          title: phase.title,
          description: phase.description ?? "",
          deliverables: phase.deliverables ?? [],
        })),
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
      `Delete "${template.name}"? This cannot be undone.`,
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
                Manage reusable delivery workflows for Octalve projects, including package structure, phases and client-visible deliverables.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-xs font-bold text-white">
                  {state.templates.length} templates
                </span>
                <span className="rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-xs font-bold text-white">
                  {totalPhases} phases
                </span>
                <span className="rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-xs font-bold text-white">
                  {totalDeliverables} deliverables
                </span>
                <span className="rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-xs font-bold text-white">
                  {catalogCoverage}/{PACKAGE_CATALOG.length} package workflows
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              {canSyncDefaultTemplates ? (

                <Button type="button"
                variant="secondary"
                loading={loadingAction === "sync"}
                onClick={syncDefaultTemplates}
                className="bg-white text-[#E61525]"
              >
<RefreshCw size={16} />
                Sync Default Templates

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
              {totalPhases}
            </strong>
            <span className="text-sm font-semibold text-slate-500">
              Reusable phases
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
              Package coverage
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
                  Open a template to manage its package, phases and deliverables.
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
              state.templates.map((template) => {
                const catalog = getPackageCatalogItem(template.packageType);
                const deliverables = countDeliverables(template);

                return (
                  <div
                    key={template.id}
                    className="grid gap-4 px-5 py-5 transition hover:bg-slate-50 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
                  >
                    <div className="flex min-w-0 gap-4">
                      <span
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
                        style={{
                          backgroundColor: `${catalog.color}14`,
                          color: catalog.color,
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
                              backgroundColor: `${catalog.color}14`,
                              color: catalog.color,
                            }}
                          >
                            {catalog.title}
                          </span>
                        </div>

                        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                          {template.description || catalog.description}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                          <span>{template.phases.length} phases</span>
                          <span>{deliverables} deliverables</span>
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
                  Sync the official Octalve templates or create a custom delivery workflow.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  {canSyncDefaultTemplates ? (

                    <Button variant="secondary"
                    loading={loadingAction === "sync"}
                    onClick={syncDefaultTemplates}
                  >
<RefreshCw size={16} />
                    Sync Default Templates

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
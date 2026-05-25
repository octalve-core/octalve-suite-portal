"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  FileText,
  Loader2,
  Mail,
  RefreshCcw,
  Save,
  ToggleLeft,
} from "lucide-react";

import { api } from "@/lib/api";
import type { EmailTemplate, EmailTemplateUpdateInput } from "@/lib/types";

const VARIABLE_GUIDE = [
  "{{clientName}}",
  "{{businessName}}",
  "{{projectName}}",
  "{{projectTitle}}",
  "{{phaseTitle}}",
  "{{paymentReference}}",
  "{{amount}}",
  "{{senderName}}",
  "{{verificationUrl}}",
];

function formatEventKey(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function TemplateStatusPill({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em]",
        enabled
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600",
      ].join(" ")}
    >
      {enabled ? "Enabled" : "Disabled"}
    </span>
  );
}

function TemplateField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function TemplateTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <textarea
        value={value}
        rows={8}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-950 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

export function AdminEmailTemplateSettings() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [form, setForm] = useState<EmailTemplateUpdateInput | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.eventKey === selectedKey),
    [selectedKey, templates],
  );

  async function load(mode: "initial" | "refresh" = "initial") {
    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);

    setError("");
    setNotice("");

    try {
      const data = await api.systemSettings.emailTemplates.list();
      setTemplates(data);

      const nextSelected =
        data.find((template) => template.eventKey === selectedKey) ??
        data[0] ??
        null;

      if (nextSelected) {
        setSelectedKey(nextSelected.eventKey);
        setForm({
          eventKey: nextSelected.eventKey,
          title: nextSelected.title,
          subject: nextSelected.subject,
          body: nextSelected.body,
          channel: nextSelected.channel,
          isEnabled: nextSelected.isEnabled,
        });
      }

      if (mode === "refresh") {
        setNotice("Email templates refreshed.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load email templates.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load("initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectTemplate(template: EmailTemplate) {
    setSelectedKey(template.eventKey);
    setNotice("");
    setError("");
    setForm({
      eventKey: template.eventKey,
      title: template.title,
      subject: template.subject,
      body: template.body,
      channel: template.channel,
      isEnabled: template.isEnabled,
    });
  }

  async function save() {
    if (!form) return;

    setSaving(true);
    setNotice("");
    setError("");

    try {
      const saved = await api.systemSettings.emailTemplates.update({
        eventKey: form.eventKey,
        title: form.title,
        subject: form.subject,
        body: form.body,
        channel: "EMAIL",
        isEnabled: form.isEnabled,
      });

      setTemplates((current) =>
        current.map((template) =>
          template.eventKey === saved.eventKey ? saved : template,
        ),
      );

      setSelectedKey(saved.eventKey);
      setForm({
        eventKey: saved.eventKey,
        title: saved.title,
        subject: saved.subject,
        body: saved.body,
        channel: saved.channel,
        isEnabled: saved.isEnabled,
      });

      setNotice("Email template saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save email template.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.055)] sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.16em] text-[#0064E0]">
            Email Templates
          </span>
          <h3 className="mt-1 text-2xl font-semibold tracking-[-0.045em] text-slate-950">
            Template Library
          </h3>
          <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">
            Edit email subjects and message bodies. Templates only send when email alerts, provider selection, provider environment keys and the specific template are enabled.
          </p>
        </div>

        <button
          type="button"
          onClick={() => load("refresh")}
          disabled={loading || refreshing || saving}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0064E0] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <RefreshCcw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid min-h-60 place-items-center">
          <div className="inline-flex items-center gap-3 text-sm font-bold text-slate-500">
            <Loader2 size={18} className="animate-spin" />
            Loading email templates...
          </div>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && notice ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {notice}
        </div>
      ) : null}

      {!loading && templates.length ? (
        <div className="mt-5 grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="grid gap-2">
              {templates.map((template) => {
                const active = template.eventKey === selectedKey;

                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => selectTemplate(template)}
                    className={[
                      "w-full rounded-2xl border p-4 text-left transition",
                      active
                        ? "border-[#0064E0] bg-white shadow-[0_12px_26px_rgba(0,100,224,0.10)]"
                        : "border-transparent bg-transparent hover:border-slate-200 hover:bg-white",
                    ].join(" ")}
                  >
                    <span className="flex items-start gap-3">
                      <span
                        className={[
                          "grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1",
                          template.isEnabled
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                            : "bg-white text-slate-500 ring-slate-200",
                        ].join(" ")}
                      >
                        {template.isEnabled ? (
                          <CheckCircle2 size={17} />
                        ) : (
                          <Mail size={17} />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-sm font-bold text-slate-950">
                          {template.title || formatEventKey(template.eventKey)}
                        </strong>
                        <small className="mt-1 block truncate text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                          {template.eventKey}
                        </small>
                        <span className="mt-2 block">
                          <TemplateStatusPill enabled={template.isEnabled} />
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {form && selectedTemplate ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    {form.eventKey}
                  </span>
                  <h4 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-slate-950">
                    {formatEventKey(form.eventKey)}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, isEnabled: !form.isEnabled })}
                  className={[
                    "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-bold transition",
                    form.isEnabled
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-50 text-slate-600",
                  ].join(" ")}
                  aria-pressed={form.isEnabled}
                >
                  <ToggleLeft size={17} />
                  {form.isEnabled ? "Enabled" : "Disabled"}
                </button>
              </div>

              <div className="grid gap-5">
                <TemplateField
                  label="Template Title"
                  value={form.title}
                  onChange={(value) => setForm({ ...form, title: value })}
                />

                <TemplateField
                  label="Subject"
                  value={form.subject}
                  onChange={(value) => setForm({ ...form, subject: value })}
                />

                <TemplateTextarea
                  label="Body"
                  value={form.body}
                  onChange={(value) => setForm({ ...form, body: value })}
                />

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex gap-3">
                    <FileText size={18} className="mt-0.5 shrink-0 text-[#0064E0]" />
                    <div>
                      <strong className="block text-sm font-bold text-blue-950">
                        Supported variables
                      </strong>
                      <p className="mt-1 text-sm font-semibold leading-6 text-blue-900">
                        Use only controlled variables. Unknown variables render empty.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {VARIABLE_GUIDE.map((variable) => (
                          <code
                            key={variable}
                            className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-bold text-[#0064E0]"
                          >
                            {variable}
                          </code>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => load("refresh")}
                    disabled={saving || refreshing}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0064E0] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <RefreshCcw size={16} className={refreshing ? "animate-spin" : ""} />
                    Reset
                  </button>

                  <button
                    type="button"
                    onClick={save}
                    disabled={saving || refreshing}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(0,100,224,0.18)] transition hover:bg-[#0052B8] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Save size={16} />
                    {saving ? "Saving..." : "Save Template"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {!loading && !templates.length && !error ? (
        <div className="grid min-h-52 place-items-center text-center">
          <div>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
              <Mail size={24} />
            </span>
            <strong className="mt-4 block text-base font-semibold text-slate-950">
              No templates yet
            </strong>
            <span className="mt-1 block text-sm font-medium text-slate-500">
              Refresh to generate default templates from the server.
            </span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
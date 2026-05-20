"use client";

import { useState } from "react";
import { CalendarClock, Save } from "lucide-react";

import type { Project } from "@/lib/types";
import { useApp } from "./AppContext";
import { formatProjectDate } from "./ProjectDateCountdown";

function toDateInputValue(value?: string) {
  if (!value) return "";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toISOString().slice(0, 10);
}

export function ProjectDeadlineEditor({
  project,
  role,
}: {
  project: Project;
  role: "admin" | "staff" | "client";
}) {
  const { updateProject } = useApp();

  const canEdit = role === "admin";
  const [date, setDate] = useState(toDateInputValue(project.targetDate));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function saveDate() {
    setNotice("");
    setError("");
    setSaving(true);

    try {
      await updateProject(project.id, {
        targetDate: date || "",
      });
      setNotice("Saved");
      window.setTimeout(() => setNotice(""), 1600);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to update target date.");
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) {
    return (
      <div>
        <span className="text-sm font-semibold text-slate-500">Target Date</span>
        <strong className="mt-1 block text-slate-950">
          {formatProjectDate(project.targetDate)}
        </strong>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
          <CalendarClock size={17} />
        </span>

        <div className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-500">
            Target Date
          </span>
          <strong className="mt-1 block text-sm text-slate-950">
            {formatProjectDate(project.targetDate)}
          </strong>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setError("");
                setNotice("");
              }}
              className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
            />

            <button
              type="button"
              onClick={saveDate}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0064E0] px-4 text-sm font-bold text-white transition hover:bg-[#0057c2] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={15} />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>

          {notice ? (
            <p className="mt-2 text-xs font-bold text-emerald-600">{notice}</p>
          ) : null}

          {error ? (
            <p className="mt-2 text-xs font-bold text-red-600">{error}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
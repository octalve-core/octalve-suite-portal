"use client";

import type React from "react";
import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useApp } from "./AppContext";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  PageHeader,
  statusLabel,
} from "./UI";

function roleDisplay(role?: string) {
  if (!role) return "Workspace User";
  if (role === "SUPER_ADMIN") return "Administrator";
  if (role === "PROJECT_MANAGER") return "Project Manager";
  if (role === "STAFF") return "Staff";
  return "Client";
}

function daysUntil(date?: string) {
  if (!date) return null;

  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return null;

  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(date?: string) {
  if (!date) return "Not set";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Not set";

  return parsed.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function PasswordModal({ onClose }: { onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  async function submit() {
    setError("");
    setMessage("");

    if (!form.currentPassword || !form.newPassword) {
      setError("Current password and new password are required.");
      return;
    }

    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setSaving(true);

    try {
      const result = await (authClient as any).changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        revokeOtherSessions: true,
      });

      if (result?.error) {
        setError(result.error.message || "Could not change password.");
        setSaving(false);
        return;
      }

      setMessage("Password changed successfully.");
      setTimeout(onClose, 900);
    } catch {
      setError("Password change failed. Please confirm your current password.");
      setSaving(false);
    }
  }

  const inputType = visible ? "text" : "password";

  return (
    <Modal title="Change Password" onClose={onClose} width="540px">
      <div className="stack">
        {error && (
          <div className="badge badge-red" style={{ justifyContent: "flex-start" }}>
            {error}
          </div>
        )}

        {message && (
          <div className="badge badge-green" style={{ justifyContent: "flex-start" }}>
            {message}
          </div>
        )}

        <Field label="Current password">
          <Input
            type={inputType}
            value={form.currentPassword}
            onChange={(event) =>
              setForm({ ...form, currentPassword: event.target.value })
            }
            placeholder="Enter current password"
            disabled={saving}
          />
        </Field>

        <Field label="New password">
          <Input
            type={inputType}
            value={form.newPassword}
            onChange={(event) =>
              setForm({ ...form, newPassword: event.target.value })
            }
            placeholder="Minimum 8 characters"
            disabled={saving}
          />
        </Field>

        <Field label="Confirm new password">
          <Input
            type={inputType}
            value={form.confirmPassword}
            onChange={(event) =>
              setForm({ ...form, confirmPassword: event.target.value })
            }
            placeholder="Repeat new password"
            disabled={saving}
            onKeyDown={(event) => event.key === "Enter" && submit()}
          />
        </Field>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setVisible((value) => !value)}
          style={{ justifySelf: "start" }}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          {visible ? "Hide passwords" : "Show passwords"}
        </button>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button loading={saving} onClick={submit}>
            Update Password
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function ProfileSettings({
  title = "Settings",
  subtitle = "Manage your profile and workspace preferences",
}: {
  title?: string;
  subtitle?: string;
}) {
  const { currentUser, selectedProject, refresh } = useApp();

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: currentUser?.name ?? "",
    email: currentUser?.email ?? "",
    phone: currentUser?.phone ?? "",
    company: currentUser?.company ?? "",
    specialty: currentUser?.specialty ?? "",
  });

  const countdown = useMemo(
    () => daysUntil(selectedProject?.targetDate),
    [selectedProject?.targetDate],
  );

  async function updateProfile() {
    setError("");
    setNotice("");

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          company: form.company,
          specialty: form.specialty,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Could not update profile.");
        setSaving(false);
        return;
      }

      await refresh();
      setNotice("Profile updated successfully.");
      setSaving(false);
    } catch {
      setError("Could not update profile. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="content narrow">
      <PageHeader title={title} subtitle={subtitle} />

      <div className="stack">
        <Card className="card-body">
          <div className="settings-profile-head">
            <div className="deliverable-main">
              <div
                className="avatar"
                style={{
                  width: 58,
                  height: 58,
                  fontSize: 22,
                  background: "var(--primary-soft)",
                  color: "var(--primary)",
                }}
              >
                {form.name?.[0]?.toUpperCase() || "O"}
              </div>

              <div>
                <h2 style={{ margin: 0 }}>{form.name || "Workspace User"}</h2>
                <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                  {form.email || "No email available"}
                </p>
              </div>
            </div>

            <Badge className="badge-purple">
              {roleDisplay(currentUser?.role)}
            </Badge>
          </div>

          {notice && (
            <div className="badge badge-green" style={{ marginBottom: 18 }}>
              <CheckCircle2 size={14} /> {notice}
            </div>
          )}

          {error && (
            <div className="badge badge-red" style={{ marginBottom: 18 }}>
              {error}
            </div>
          )}

          <div className="form-grid">
            <Field label="Name">
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                disabled={saving}
              />
            </Field>

            <Field label="Email">
              <Input value={form.email} readOnly />
            </Field>

            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
                placeholder="Not provided"
                disabled={saving}
              />
            </Field>

            <Field label="Company / Brand">
              <Input
                value={form.company}
                onChange={(event) =>
                  setForm({ ...form, company: event.target.value })
                }
                placeholder="Not provided"
                disabled={saving}
              />
            </Field>

            <Field label="Specialty / Role Label">
              <Input
                value={form.specialty}
                onChange={(event) =>
                  setForm({ ...form, specialty: event.target.value })
                }
                placeholder={roleDisplay(currentUser?.role)}
                disabled={saving}
              />
            </Field>

            <Field label="Access Role">
              <Input
                value={
                  currentUser?.specialty ||
                  roleDisplay(currentUser?.role) ||
                  statusLabel(currentUser?.role ?? "CLIENT")
                }
                readOnly
              />
            </Field>
          </div>

          <div className="settings-actions">
            <Button loading={saving} onClick={updateProfile}>
              <Save size={16} /> Update Profile
            </Button>

            <Button
              variant="secondary"
              onClick={() => setPasswordOpen(true)}
              disabled={saving}
            >
              <LockKeyhole size={16} /> Change Password
            </Button>
          </div>
        </Card>

        <Card className="card-body">
          <div className="deliverable-main" style={{ marginBottom: 18 }}>
            <div className="deliverable-icon">
              <CalendarClock size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>Project Date & Countdown</h2>
              <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                Calendar dates are selected from project setup and shown here as a live deadline countdown.
              </p>
            </div>
          </div>

          <div className="grid-2-even">
            <div className="date-countdown-card">
              <span>Active Project</span>
              <strong>{selectedProject?.title ?? "No active project selected"}</strong>
            </div>

            <div className="date-countdown-card">
              <span>Target Date</span>
              <strong>{formatDate(selectedProject?.targetDate)}</strong>
            </div>

            <div className="date-countdown-card">
              <span>Countdown</span>
              <strong>
                {countdown === null
                  ? "Not set"
                  : countdown < 0
                    ? `${Math.abs(countdown)} days overdue`
                    : countdown === 0
                      ? "Due today"
                      : `${countdown} days left`}
              </strong>
            </div>

            <div className="date-countdown-card">
              <span>Status</span>
              <strong>{statusLabel(selectedProject?.status ?? "ACTIVE")}</strong>
            </div>
          </div>
        </Card>

        <Card className="card-body">
          <div className="deliverable-main">
            <div className="deliverable-icon">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>Security</h2>
              <p style={{ margin: "6px 0 18px", color: "var(--muted)" }}>
                Use a strong password and update it regularly to keep your workspace secure.
              </p>
              <Button variant="secondary" onClick={() => setPasswordOpen(true)}>
                <LockKeyhole size={16} /> Change Password
              </Button>
            </div>
          </div>
        </Card>

        <Card className="card-body">
          <div className="deliverable-main">
            <div className="deliverable-icon">
              <UserRound size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>Profile Notes</h2>
              <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                Email and access role are protected fields. Contact an admin if those need to be changed.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {passwordOpen && <PasswordModal onClose={() => setPasswordOpen(false)} />}
    </div>
  );
}

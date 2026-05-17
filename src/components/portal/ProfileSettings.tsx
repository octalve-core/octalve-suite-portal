"use client";

import { ShieldCheck, UserRound, Bell, LockKeyhole } from "lucide-react";
import { useApp } from "./AppContext";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
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

export function ProfileSettings({
  title = "Settings",
  subtitle = "Manage your profile and workspace preferences",
}: {
  title?: string;
  subtitle?: string;
}) {
  const { currentUser } = useApp();

  const name = currentUser?.name ?? "";
  const email = currentUser?.email ?? "";
  const company = currentUser?.company ?? "";
  const phone = currentUser?.phone ?? "";
  const role = currentUser?.role ?? "CLIENT";
  const specialty = currentUser?.specialty ?? "";

  return (
    <div className="content narrow">
      <PageHeader title={title} subtitle={subtitle} />

      <div className="stack">
        <Card className="card-body">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 20,
              marginBottom: 26,
            }}
          >
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
                {name?.[0]?.toUpperCase() || "O"}
              </div>
              <div>
                <h2 style={{ margin: 0 }}>{name || "Workspace User"}</h2>
                <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                  {email || "No email available"}
                </p>
              </div>
            </div>

            <Badge className="badge-purple">{roleDisplay(role)}</Badge>
          </div>

          <div className="form-grid">
            <Field label="Name">
              <Input value={name} readOnly />
            </Field>

            <Field label="Email">
              <Input value={email} readOnly />
            </Field>

            <Field label="Phone">
              <Input value={phone} readOnly placeholder="Not provided" />
            </Field>

            <Field label="Company / Brand">
              <Input value={company} readOnly placeholder="Not provided" />
            </Field>

            <Field label="Role">
              <Input value={specialty || roleDisplay(role) || statusLabel(role as any)} readOnly />
            </Field>

            <Field label="Account Status">
              <Input value="Active" readOnly />
            </Field>
          </div>
        </Card>

        <Card className="card-body">
          <div className="deliverable-main" style={{ marginBottom: 18 }}>
            <div className="deliverable-icon">
              <Bell size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>Notifications</h2>
              <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                Choose how workspace updates should reach you.
              </p>
            </div>
          </div>

          {[
            "Email notifications",
            "Project updates",
            "Approval requests",
            "Payment confirmations",
          ].map((item, index, arr) => (
            <div
              className="timeline-row"
              key={item}
              style={{
                padding: "16px 0",
                borderBottom:
                  index === arr.length - 1 ? "none" : "1px solid var(--line)",
              }}
            >
              <div>
                <strong>{item}</strong>
                <p style={{ margin: 4, color: "var(--muted)" }}>
                  Receive updates for {item.toLowerCase()}.
                </p>
              </div>
              <input type="checkbox" defaultChecked />
            </div>
          ))}
        </Card>

        <div className="grid-2-even">
          <Card className="card-body">
            <div className="deliverable-main">
              <div className="deliverable-icon">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h2 style={{ margin: 0 }}>Security</h2>
                <p style={{ margin: "6px 0 18px", color: "var(--muted)" }}>
                  Your account is protected by Octalve Workspace authentication.
                </p>
                <Button variant="secondary">
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
                <h2 style={{ margin: 0 }}>Profile Updates</h2>
                <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                  Contact the Octalve team if your name, company, role, or phone
                  number needs to be updated.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

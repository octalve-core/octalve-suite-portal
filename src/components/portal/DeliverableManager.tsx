"use client";

import { useState } from "react";
import {
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck2,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Deliverable, ProjectPhase } from "@/lib/types";
import { useApp } from "./AppContext";
import {
  Badge,
  Button,
  Field,
  Icons,
  Input,
  Modal,
  Select,
  statusLabel,
  Textarea,
} from "./UI";

type DeliverableLinkType = NonNullable<Deliverable["linkType"]>;
type EditableDeliverableStatus = Exclude<Deliverable["status"], "APPROVED">;

function deliverableBadge(status: string) {
  if (status === "APPROVED") return "badge-green";
  if (status === "READY_FOR_REVIEW") return "badge-purple";
  if (status === "NEEDS_CHANGES") return "badge-red";
  return "badge-slate";
}

function canEditDeliverable(phase: ProjectPhase, deliverable: Deliverable) {
  return phase.status !== "APPROVED" && deliverable.status !== "APPROVED";
}

function DeliverableEditModal({
  deliverable,
  onClose,
}: {
  deliverable: Deliverable;
  onClose: () => void;
}) {
  const { updateDeliverable } = useApp();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    description: string;
    link: string;
    linkType: DeliverableLinkType;
    visibleToClient: boolean;
    status: EditableDeliverableStatus;
  }>({
    name: deliverable.name ?? "",
    description: deliverable.description ?? "",
    link: deliverable.link ?? "",
    linkType: deliverable.linkType ?? "Other",
    visibleToClient: deliverable.visibleToClient,
    status:
      deliverable.status === "APPROVED"
        ? "READY_FOR_REVIEW"
        : deliverable.status,
  });

  async function submit() {
    if (!form.name.trim()) return;

    setLoading(true);

    try {
      await updateDeliverable(deliverable.id, {
        name: form.name,
        description: form.description,
        link: form.link,
        linkType: form.linkType,
        visibleToClient: form.visibleToClient,
        status: form.status,
      });

      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Edit Deliverable" onClose={onClose} width="620px">
      <div className="stack">
        <Field label="Deliverable name">
          <Input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="e.g. Homepage Design Preview"
            disabled={loading}
          />
        </Field>

        <Field label="Link">
          <Input
            value={form.link}
            onChange={(event) => setForm({ ...form, link: event.target.value })}
            placeholder="https://..."
            disabled={loading}
          />
        </Field>

        <div className="form-grid">
          <Field label="Link type">
            <Select
              value={form.linkType}
              onChange={(event) =>
                setForm({
                  ...form,
                  linkType: event.target.value as DeliverableLinkType,
                })
              }
              disabled={loading}
            >
              <option>Figma</option>
              <option>Google Drive</option>
              <option>Web Preview</option>
              <option>Document</option>
              <option>Other</option>
            </Select>
          </Field>

          <Field label="Status">
            <Select
              value={form.status}
              onChange={(event) =>
                setForm({
                  ...form,
                  status: event.target.value as EditableDeliverableStatus,
                })
              }
              disabled={loading}
            >
              <option value="DRAFT">Draft</option>
              <option value="READY_FOR_REVIEW">Ready for review</option>
              <option value="NEEDS_CHANGES">Needs changes</option>
            </Select>
          </Field>
        </div>

        <Field label="Description">
          <Textarea
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            placeholder="Short note for the client or internal team..."
            disabled={loading}
          />
        </Field>

        <label
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            color: "var(--muted)",
            fontWeight: 600,
          }}
        >
          <input
            type="checkbox"
            checked={form.visibleToClient}
            onChange={(event) =>
              setForm({ ...form, visibleToClient: event.target.checked })
            }
            disabled={loading}
          />
          Visible to client
        </label>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button loading={loading} onClick={submit}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function DeliverableManager({
  phase,
  emptyText = "No deliverables have been added yet.",
}: {
  phase: ProjectPhase;
  emptyText?: string;
}) {
  const { deleteDeliverable } = useApp();
  const [editing, setEditing] = useState<Deliverable | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function removeDeliverable(deliverable: Deliverable) {
    if (!confirm(`Delete "${deliverable.name}"?`)) return;

    setPendingDelete(deliverable.id);

    try {
      await deleteDeliverable(deliverable.id);
    } finally {
      setPendingDelete(null);
    }
  }

  if (!phase.deliverables.length) {
    return (
      <div
        style={{
          border: "1px dashed var(--line)",
          borderRadius: 14,
          padding: 18,
          color: "var(--muted)",
          textAlign: "center",
        }}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <>
      <div className="stack" style={{ gap: 12 }}>
        {phase.deliverables.map((deliverable) => {
          const editable = canEditDeliverable(phase, deliverable);

          return (
            <div className="deliverable-row" key={deliverable.id}>
              <div className="deliverable-main">
                <div className="deliverable-icon">
                  <FileCheck2 size={18} />
                </div>

                <div>
                  <strong>{deliverable.name}</strong>

                  {deliverable.description && (
                    <p style={{ color: "var(--muted)", margin: "5px 0 0" }}>
                      {deliverable.description}
                    </p>
                  )}

                  {deliverable.link && (
                    <a
                      href={deliverable.link}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        marginTop: 8,
                        color: "var(--primary)",
                        display: "inline-flex",
                        gap: 6,
                        alignItems: "center",
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      {deliverable.linkType ?? "Open link"}
                      <ExternalLink size={13} />
                    </a>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      marginTop: 10,
                    }}
                  >
                    <Badge className={deliverableBadge(deliverable.status)}>
                      {statusLabel(deliverable.status)}
                    </Badge>

                    <Badge
                      className={
                        deliverable.visibleToClient
                          ? "badge-blue"
                          : "badge-slate"
                      }
                    >
                      {deliverable.visibleToClient ? (
                        <>
                          <Eye size={12} /> Client visible
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} /> Internal
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                }}
              >
                {editable ? (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => setEditing(deliverable)}
                      style={{ height: 36, padding: "0 12px", fontSize: 13 }}
                    >
                      <Pencil size={14} /> Edit
                    </Button>

                    <Button
                      variant="danger"
                      loading={pendingDelete === deliverable.id}
                      onClick={() => removeDeliverable(deliverable)}
                      style={{ height: 36, padding: "0 12px", fontSize: 13 }}
                    >
                      <Trash2 size={14} /> Delete
                    </Button>
                  </>
                ) : (
                  <Badge className="badge-green">{Icons.lock} Locked</Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <DeliverableEditModal
          deliverable={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

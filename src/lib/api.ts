/**
 * Typed API service layer — wraps all backend endpoints with typed fetch calls.
 * Used by AppContext to replace localStorage-based state management.
 */
import type {
  Project,
  ProjectTemplate,
  ProjectRequest,
  ProjectPhase,
  Deliverable,
  PhaseMessage,
  User,
  Review,
  NotificationItem,
  PackageType,
  Role,
} from "@/lib/types";

// ─── Fetch Helpers ────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string, init?: RequestInit, retries = 2): Promise<T> {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...init?.headers },
      ...init,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error ?? `API error ${res.status}`);
    }
    return res.json();
  } catch (error) {
    if (retries > 0 && error instanceof TypeError && error.message === "Failed to fetch") {
      // Small delay before retry
      await new Promise((resolve) => setTimeout(resolve, 500));
      return fetchJson<T>(url, init, retries - 1);
    }
    throw error;
  }
}

function post<T>(url: string, data?: unknown): Promise<T> {
  return fetchJson<T>(url, { method: "POST", body: data ? JSON.stringify(data) : undefined });
}

function patch<T>(url: string, data: unknown): Promise<T> {
  return fetchJson<T>(url, { method: "PATCH", body: JSON.stringify(data) });
}

function del<T = { success: boolean }>(url: string): Promise<T> {
  return fetchJson<T>(url, { method: "DELETE" });
}

// ─── API Object ───────────────────────────────────────────────────────────────

export const api = {
  // ── Session ──
  me: () => fetchJson<User>("/api/me"),

  // ── Templates ──
  templates: {
    list: () => fetchJson<ProjectTemplate[]>("/api/templates"),
    create: (data: { name: string; packageType: PackageType; description: string; phases: { title: string; description?: string; deliverables?: string[] }[] }) =>
      post<ProjectTemplate>("/api/templates", data),
    update: (id: string, data: Partial<Omit<ProjectTemplate, "id">>) =>
      patch<ProjectTemplate>(`/api/templates/${id}`, data),
    delete: (id: string) => del(`/api/templates/${id}`),
  },

  // ── Project Requests ──
  projectRequests: {
    list: () => fetchJson<(ProjectRequest & { client?: { id: string; name: string; email: string; company?: string } })[]>("/api/project-requests"),
    create: (data: Omit<ProjectRequest, "id" | "clientId" | "status" | "createdAt">) =>
      post<ProjectRequest>("/api/project-requests", data),
    approve: (id: string, data: { totalAmount: number; depositAmount: number; balanceAmount: number; projectManagerId?: string; targetDate?: string; internalNotes?: string }) =>
      post<Project>(`/api/project-requests/${id}/approve`, data),
  },

  // ── Projects ──
  projects: {
    list: () => fetchJson<Project[]>("/api/projects"),
    get: (id: string) => fetchJson<Project>(`/api/projects/${id}`),
    create: (data: { packageType: PackageType; templateId: string; title: string; clientName: string; clientEmail: string; targetDate?: string; totalAmount: number; depositAmount: number; balanceAmount: number; projectManagerId?: string; internalNotes?: string }) =>
      post<Project>("/api/projects", data),
    delete: (id: string) => del(`/api/projects/${id}`),
  },

  // ── Payments ──
  payments: {
    markPaid: (id: string) => post<{ success: boolean }>(`/api/payments/${id}/mark-paid`),
    confirm: (id: string) => post<{ success: boolean }>(`/api/payments/${id}/confirm`),
    reject: (id: string, note?: string) => post<{ success: boolean }>(`/api/payments/${id}/reject`, { note }),
  },

  // ── Phases ──
  phases: {
    get: (id: string) => fetchJson<ProjectPhase>(`/api/phases/${id}`),
    assign: (id: string, staffId: string) => patch<ProjectPhase>(`/api/phases/${id}/assign`, { staffId }),
    addDeliverable: (phaseId: string, data: Pick<Deliverable, "name" | "description" | "link" | "linkType">) =>
      post<Deliverable>(`/api/phases/${phaseId}/deliverables`, data),
    requestApproval: (id: string) => post<{ success: boolean }>(`/api/phases/${id}/request-approval`),
    approve: (id: string) => post<{ success: boolean }>(`/api/phases/${id}/approve`),
    requestChanges: (id: string, message: string) => post<{ success: boolean }>(`/api/phases/${id}/request-changes`, { message }),
  },

  // ── Messages ──
  messages: {
    list: (phaseId: string) => fetchJson<PhaseMessage[]>(`/api/messages/${phaseId}`),
    send: (phaseId: string, message: string) => post<PhaseMessage>(`/api/messages/${phaseId}`, { message }),
  },

  // ── Reviews ──
  reviews: {
    list: () => fetchJson<Review[]>("/api/reviews"),
    create: (data: { projectId: string; rating: number; comment: string; permissionToPublish: boolean }) =>
      post<Review>("/api/reviews", data),
  },

  // ── Analytics ──
  analytics: {
    get: () => fetchJson<{
      totalProjects: number;
      activeProjects: number;
      completedProjects: number;
      overduePhases: number;
      packageBreakdown: { name: string; value: number }[];
      phaseBreakdown: { status: string; count: number }[];
      totalRevenue: number;
      confirmedRevenue: number;
    }>("/api/analytics"),
  },

  // ── Team ──
  team: {
    list: () => fetchJson<User[]>("/api/team"),
    create: (data: { name: string; email: string; specialty: string; role: Role }) =>
      post<User>("/api/team", data),
    update: (id: string, data: Partial<Pick<User, "name" | "email" | "specialty" | "role">>) =>
      patch<User>(`/api/team/${id}`, data),
    delete: (id: string) => del(`/api/team/${id}`),
  },

  // ── Clients ──
  clients: {
    list: () => fetchJson<(User & { _count: { clientProjects: number }; clientProjects: { id: string; status: string; packageType: string }[] })[]>("/api/clients"),
  },

  // ── Notifications ──
  notifications: {
    list: () => fetchJson<NotificationItem[]>("/api/notifications"),
    markRead: (id: string) => patch<{ success: boolean }>(`/api/notifications/${id}`, { read: true }),
  },
};

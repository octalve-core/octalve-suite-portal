/**
 * Typed API service layer - wraps all backend endpoints with typed fetch calls.
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
  WalletSummary,
  WalletTopUpInitializeResponse,
  WalletTopUpVerifyResponse,
  PaymentBankDetails,
  PaymentGatewaySetting,
  SupportSetting,
  WorkspaceDefaultSetting,
  NotificationDefaultSetting,
  EmailTemplate,
  EmailTemplateUpdateInput,
  WorkspacePublicSettings,
  PaymentInitializeResponse,
  PaymentMethodOption,
  PaymentVerifyResponse,
  AdminPaymentFinanceAudit,
  AdminWalletOverview,
  AdminWalletTopUpAudit,
  PackageType,
  Role,
} from "@/lib/types";

// -----------------------------------------------------------------------------
// Fetch Helpers
// -----------------------------------------------------------------------------

function isRetryableFetchError(error: unknown) {
  return error instanceof TypeError && String(error) === "TypeError: Failed to fetch";
}

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
    if (retries > 0 && isRetryableFetchError(error)) {
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

// -----------------------------------------------------------------------------
// API Object
// -----------------------------------------------------------------------------

export const api = {
  // Session
  me: () => fetchJson<User>("/api/me"),

  // Safe authenticated settings exposed to client/staff/admin UI.
  workspacePublicSettings: {
    get: () => fetchJson<WorkspacePublicSettings>("/api/workspace-public-settings"),
  },

  // Templates
  templates: {
    list: () => fetchJson<ProjectTemplate[]>("/api/templates"),
    create: (data: { name: string; packageType: PackageType; description: string; phases: { title: string; description?: string; deliverables?: string[] }[] }) =>
      post<ProjectTemplate>("/api/templates", data),
    update: (id: string, data: Partial<Omit<ProjectTemplate, "id">>) =>
      patch<ProjectTemplate>(`/api/templates/${id}`, data),
    delete: (id: string) => del(`/api/templates/${id}`),
  },

  // Project Requests
  projectRequests: {
    list: () => fetchJson<(ProjectRequest & { client?: { id: string; name: string; email: string; company?: string } })[]>("/api/project-requests"),
    create: (data: Omit<ProjectRequest, "id" | "clientId" | "status" | "createdAt">) =>
      post<ProjectRequest>("/api/project-requests", data),
    approve: (id: string, data: { totalAmount: number; depositAmount: number; balanceAmount: number; depositPercentage: number; projectManagerId?: string; targetDate?: string; internalNotes?: string }) =>
      post<Project>(`/api/project-requests/${id}/approve`, data),
  },

  // Projects
  projects: {
    list: () => fetchJson<Project[]>("/api/projects"),
    get: (id: string) => fetchJson<Project>(`/api/projects/${id}`),
    create: (data: {
      packageType: PackageType;
      templateId: string;
      title: string;
      clientName: string;
      clientEmail: string;
      targetDate?: string;
      totalAmount: number;
      depositAmount: number;
      balanceAmount: number;
      depositPercentage: number;
      projectManagerId?: string;
      internalNotes?: string;
    }) => post<Project>("/api/projects", data),
    update: (
      id: string,
      data: Partial<Pick<Project, "title" | "targetDate" | "internalNotes" | "projectManagerId">>,
    ) => patch<Project>(`/api/projects/${id}`, data),
    delete: (id: string) => del(`/api/projects/${id}`),
  },
  // Wallet
  wallet: {
    get: () => fetchJson<WalletSummary>("/api/wallet"),
    initializeTopUp: (amount: number, provider: string) =>
      post<WalletTopUpInitializeResponse>("/api/wallet/topups/initialize", {
        amount,
        provider,
      }),
    verifyPaystackTopUp: (data: { reference: string; topUpId?: string }) =>
      post<WalletTopUpVerifyResponse>("/api/wallet/topups/paystack/verify", data),
    verifyFlutterwaveTopUp: (data: {
      txRef?: string;
      transactionId?: string;
      topUpId?: string;
    }) => post<WalletTopUpVerifyResponse>("/api/wallet/topups/flutterwave/verify", data),
  },

  // Admin Wallet
  adminWallet: {
    overview: () => fetchJson<AdminWalletOverview>("/api/admin/wallet"),
    topUpAudit: (id: string) =>
      fetchJson<AdminWalletTopUpAudit>(`/api/admin/wallet/${id}`),
  },

  // Payments
  payments: {
    methods: (id: string) =>
      fetchJson<PaymentMethodOption[]>(`/api/payments/${id}/methods`),
    initialize: (id: string, provider: string) =>
      post<PaymentInitializeResponse>(`/api/payments/${id}/initialize`, { provider }),
    verifyPaystack: (data: { reference: string; paymentId?: string }) =>
      post<PaymentVerifyResponse>("/api/payments/paystack/verify", data),
    verifyFlutterwave: (data: { txRef?: string; transactionId?: string; paymentId?: string }) =>
      post<PaymentVerifyResponse>("/api/payments/flutterwave/verify", data),
    financeAudit: (id: string) =>
      fetchJson<AdminPaymentFinanceAudit>(`/api/admin/payments/${id}/finance-audit`),
    markPaid: (id: string) =>
      post<{ success: boolean }>(`/api/payments/${id}/mark-paid`),
    confirm: (id: string) =>
      post<{ success: boolean }>(`/api/payments/${id}/confirm`),
    reject: (id: string, note?: string) =>
      post<{ success: boolean }>(`/api/payments/${id}/reject`, { note }),
  },

  // Phases
  phases: {
    get: (id: string) => fetchJson<ProjectPhase>(`/api/phases/${id}`),
    assign: (id: string, staffId: string) => patch<ProjectPhase>(`/api/phases/${id}/assign`, { staffId }),
    addDeliverable: (phaseId: string, data: Pick<Deliverable, "name" | "description" | "link" | "linkType">) =>
      post<Deliverable>(`/api/phases/${phaseId}/deliverables`, data),
    requestApproval: (id: string) => post<{ success: boolean }>(`/api/phases/${id}/request-approval`),
    approve: (id: string) => post<{ success: boolean }>(`/api/phases/${id}/approve`),
    requestChanges: (id: string, message: string) => post<{ success: boolean }>(`/api/phases/${id}/request-changes`, { message }),
  },

  // Messages
  // Deliverables
  deliverables: {
    update: (
      id: string,
      data: Partial<Pick<Deliverable, "name" | "description" | "link" | "linkType" | "visibleToClient" | "status">>,
    ) => patch<Deliverable>(`/api/deliverables/${id}`, data),
    delete: (id: string) => del(`/api/deliverables/${id}`),
  },
  messages: {
    list: (phaseId: string) => fetchJson<PhaseMessage[]>(`/api/messages/${phaseId}`),
    send: (phaseId: string, message: string) => post<PhaseMessage>(`/api/messages/${phaseId}`, { message }),
  },

  // Reviews
  reviews: {
    list: () => fetchJson<Review[]>("/api/reviews"),
    create: (data: { projectId: string; rating: number; comment: string; permissionToPublish: boolean }) =>
      post<Review>("/api/reviews", data),
  },

  // Analytics
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

  // Team
  team: {
    list: () => fetchJson<User[]>("/api/team"),
    create: (data: { name: string; email: string; specialty: string; role: Role }) =>
      post<User>("/api/team", data),
    update: (id: string, data: Partial<Pick<User, "name" | "email" | "specialty" | "role">>) =>
      patch<User>(`/api/team/${id}`, data),
    delete: (id: string) => del(`/api/team/${id}`),
  },

  // Clients
  clients: {
    list: () => fetchJson<(User & { _count: { clientProjects: number }; clientProjects: { id: string; status: string; packageType: string }[] })[]>("/api/clients"),
  },

  // System Settings
  systemSettings: {
    paymentGateways: {
      list: () => fetchJson<PaymentGatewaySetting[]>("/api/system-settings/payment-gateways"),
      update: (data: {
        provider: string;
        isEnabled?: boolean;
        mode?: "LIVE" | "TEST";
        notes?: string;
      }) => patch<PaymentGatewaySetting[]>("/api/system-settings/payment-gateways", data),
    },
    paymentBank: {
      get: () => fetchJson<PaymentBankDetails>("/api/system-settings/payment-bank"),
      update: (data: PaymentBankDetails) =>
        patch<PaymentBankDetails>("/api/system-settings/payment-bank", data),
    },
    support: {
      get: () => fetchJson<SupportSetting>("/api/system-settings/support"),
      update: (data: Partial<SupportSetting>) =>
        patch<SupportSetting>("/api/system-settings/support", data),
    },
    workspaceDefaults: {
      get: () =>
        fetchJson<WorkspaceDefaultSetting>("/api/system-settings/workspace-defaults"),
      update: (data: Partial<WorkspaceDefaultSetting>) =>
        patch<WorkspaceDefaultSetting>("/api/system-settings/workspace-defaults", data),
    },
    notificationDefaults: {
      get: () =>
        fetchJson<NotificationDefaultSetting>("/api/system-settings/notification-defaults"),
      update: (data: Partial<NotificationDefaultSetting>) =>
        patch<NotificationDefaultSetting>("/api/system-settings/notification-defaults", data),
    },
    emailTemplates: {
      list: () => fetchJson<EmailTemplate[]>("/api/system-settings/email-templates"),
      update: (data: EmailTemplateUpdateInput) =>
        patch<EmailTemplate>("/api/system-settings/email-templates", data),
    },
  },
  // Notifications
  notifications: {
    list: () => fetchJson<NotificationItem[]>("/api/notifications"),
    markRead: (id: string) =>
      patch<{ success: boolean }>(`/api/notifications/${id}`, { read: true }),
    markAllRead: () =>
      post<{ success: boolean; count: number }>("/api/notifications/mark-all-read"),
  },
};


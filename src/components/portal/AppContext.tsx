"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { cloneInitialState } from "@/lib/seed";
import { authClient } from "@/lib/auth-client";
import {
  AppState,
  Deliverable,
  DeliverableStatus,
  PackageType,
  PhaseMessage,
  PhaseStatus,
  Project,
  ProjectPayment,
  ProjectPhase,
  ProjectRequest,
  ProjectStatus,
  ProjectTemplate,
  Role,
  TemplatePhase,
  User,
} from "@/lib/types";

const STORAGE_KEY = "octalve-suite-state-v1";
const SELECTED_PROJECT_KEY = "octalve-suite-selected-project-v1";

// Session is now derived from Better Auth — no local session storage needed.

type AppContextValue = {
  state: AppState;
  currentUser?: User;
  sessionLoading: boolean;
  selectedProjectId?: string;
  selectedProject?: Project;
  clientProjects: Project[];
  logout: () => Promise<void>;
  setSelectedProjectId: (id: string) => void;
  resetDemo: () => void;
  createProjectRequest: (
    payload: Omit<ProjectRequest, "id" | "clientId" | "status" | "createdAt">,
  ) => string;
  approveProjectRequest: (
    requestId: string,
    payload: {
      totalAmount: number;
      depositAmount: number;
      balanceAmount: number;
      projectManagerId?: string;
      targetDate?: string;
      internalNotes?: string;
    },
  ) => string;
  createAdminProject: (payload: {
    packageType: PackageType;
    templateId: string;
    title: string;
    clientName: string;
    clientEmail: string;
    targetDate?: string;
    totalAmount: number;
    depositAmount: number;
    balanceAmount: number;
    projectManagerId?: string;
    internalNotes?: string;
  }) => string;
  createTemplate: (payload: Omit<ProjectTemplate, "id">) => string;
  updateTemplate: (
    templateId: string,
    payload: Partial<Omit<ProjectTemplate, "id">>,
  ) => void;
  deleteTemplate: (templateId: string) => void;
  createTeamMember: (payload: {
    name: string;
    email: string;
    specialty: string;
    role: Role;
  }) => string;
  updateTeamMember: (
    userId: string,
    payload: Partial<Pick<User, "name" | "email" | "specialty" | "role">>,
  ) => void;
  deleteTeamMember: (userId: string) => void;
  deleteProject: (projectId: string) => void;
  markPaymentPaid: (paymentId: string) => void;
  confirmPayment: (paymentId: string) => void;
  rejectPayment: (paymentId: string, note?: string) => void;
  assignPhase: (phaseId: string, staffId: string) => void;
  addDeliverable: (
    phaseId: string,
    payload: Pick<Deliverable, "name" | "description" | "link" | "linkType">,
  ) => void;
  requestPhaseApproval: (phaseId: string) => void;
  approvePhase: (phaseId: string) => void;
  requestChanges: (phaseId: string, message: string) => void;
  sendPhaseMessage: (phaseId: string, message: string) => void;
  addReview: (
    projectId: string,
    rating: number,
    comment: string,
    permissionToPublish: boolean,
  ) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function makeProjectCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function currency(amount: number) {
  return amount;
}

function notificationForRole(
  role: Role,
  title: string,
  body: string,
  href?: string,
) {
  return {
    id: makeId("not"),
    role,
    title,
    body,
    href,
    read: false,
    createdAt: new Date().toISOString(),
  };
}

function normaliseTemplatePhases(
  phases: Array<Partial<TemplatePhase> & { deliverables?: string[] }>,
): TemplatePhase[] {
  return phases
    .filter((phase) => (phase.title ?? "").trim())
    .map((phase, index) => ({
      id: phase.id ?? makeId("tpl_phase"),
      title: (phase.title ?? `Phase ${index + 1}`).trim(),
      description: (phase.description ?? "").trim(),
      deliverables: phase.deliverables?.length
        ? phase.deliverables
        : ["Primary deliverable"],
    }));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AppState>(() => cloneInitialState());
  const [selectedProjectId, setSelectedProjectIdState] = useState<
    string | undefined
  >(undefined);

  // ------- Better Auth session -------
  const { data: authSession, isPending: sessionLoading } =
    authClient.useSession();

  // Handle bfcache (back-forward cache) to prevent seeing protected pages after logout via back button
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Page was restored from bfcache, force a reload to trigger middleware check
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const currentUser: User | undefined = useMemo(() => {
    if (!authSession?.user) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = authSession.user as any;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: (u.role ?? "CLIENT") as Role,
      phone: u.phone,
      company: u.company,
      specialty: u.specialty,
    };
  }, [authSession]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setState(JSON.parse(stored) as AppState);
      const selected = localStorage.getItem(SELECTED_PROJECT_KEY);
      if (selected) setSelectedProjectIdState(selected);
    } catch {
      setState(cloneInitialState());
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const clientProjects = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === "CLIENT")
      return state.projects.filter(
        (project) => project.clientId === currentUser.id,
      );
    return state.projects;
  }, [currentUser, state.projects]);

  const selectedProject = useMemo(() => {
    const found = clientProjects.find(
      (project) => project.id === selectedProjectId,
    );
    return found ?? clientProjects[0];
  }, [clientProjects, selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId && selectedProject?.id) {
      setSelectedProjectIdState(selectedProject.id);
      try {
        localStorage.setItem(SELECTED_PROJECT_KEY, selectedProject.id);
      } catch {}
    }
  }, [selectedProject?.id, selectedProjectId]);

  async function logout() {
    const pathname = window.location.pathname;
    const isProtected =
      pathname.startsWith("/admin") ||
      pathname.startsWith("/staff") ||
      pathname.startsWith("/client");

    await authClient.signOut();
    // Clear local storage and reset state to prevent stale data from appearing after logout
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SELECTED_PROJECT_KEY);
    } catch {}
    setState(cloneInitialState());
    setSelectedProjectIdState(undefined);

    if (isProtected) {
      router.replace(`/login?callbackURL=${encodeURIComponent(pathname)}`);
    } else {
      router.replace("/login");
    }
  }

  function setSelectedProjectId(id: string) {
    setSelectedProjectIdState(id);
    try {
      localStorage.setItem(SELECTED_PROJECT_KEY, id);
    } catch {}
  }

  function resetDemo() {
    const fresh = cloneInitialState();
    setState(fresh);
    setSelectedProjectIdState(undefined);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SELECTED_PROJECT_KEY);
    } catch {}
  }

  function createProjectRequest(
    payload: Omit<ProjectRequest, "id" | "clientId" | "status" | "createdAt">,
  ) {
    const clientId = currentUser?.id ?? "client_hello";
    const request: ProjectRequest = {
      ...payload,
      id: makeId("req"),
      clientId,
      status: "PENDING_REVIEW",
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      requests: [request, ...prev.requests],
      notifications: [
        notificationForRole(
          "SUPER_ADMIN",
          "New project request",
          `${request.projectName} is waiting for review.`,
          "/admin/project-requests",
        ),
        ...prev.notifications,
      ],
    }));
    return request.id;
  }

  function createProjectFromTemplate(args: {
    packageType: PackageType;
    templateId?: string;
    title: string;
    clientId: string;
    clientEmail: string;
    businessName: string;
    targetDate?: string;
    totalAmount: number;
    depositAmount: number;
    balanceAmount: number;
    projectManagerId?: string;
    status?: Project["status"];
    internalNotes?: string;
    clientBrief?: string;
  }): Project {
    const template =
      state.templates.find((item) => item.id === args.templateId) ??
      state.templates.find((item) => item.packageType === args.packageType) ??
      state.templates[0];
    const projectId = makeId("project");
    const code = makeProjectCode();
    const phases = template.phases.map((phase, index) => {
      const phaseId = `${projectId}_phase_${index + 1}`;
      return {
        id: phaseId,
        projectId,
        phaseNumber: index + 1,
        title: phase.title,
        description: phase.description,
        status: "LOCKED" as PhaseStatus,
        assignedStaffId: undefined,
        deliverables: phase.deliverables.map((name, deliverableIndex) => ({
          id: `${phaseId}_del_${deliverableIndex + 1}`,
          phaseId,
          name,
          status: "DRAFT" as const,
          visibleToClient: false,
        })),
        messages: [],
      };
    });
    const project: Project = {
      id: projectId,
      clientId: args.clientId,
      title: args.title,
      businessName: args.businessName,
      clientEmail: args.clientEmail,
      packageType: args.packageType,
      status: args.status ?? "APPROVED_AWAITING_DEPOSIT",
      targetDate: args.targetDate,
      projectCode: code,
      projectManagerId: args.projectManagerId,
      totalAmount: currency(args.totalAmount),
      depositAmount: currency(args.depositAmount),
      balanceAmount: currency(args.balanceAmount),
      phases,
      payments: [
        {
          id: makeId("pay"),
          projectId,
          type: "DEPOSIT",
          amount: args.depositAmount,
          status: args.depositAmount > 0 ? "UNPAID" : "CONFIRMED",
          reference: `OCT-${code}-DEP`,
          bankName: "Octalve Bank",
          accountName: "Octalve Consult",
          accountNumber: "0000000000",
        },
        {
          id: makeId("pay"),
          projectId,
          type: "BALANCE",
          amount: args.balanceAmount,
          status: args.balanceAmount > 0 ? "UNPAID" : "CONFIRMED",
          reference: `OCT-${code}-BAL`,
          bankName: "Octalve Bank",
          accountName: "Octalve Consult",
          accountNumber: "0000000000",
        },
      ],
      internalNotes: args.internalNotes,
      clientBrief: args.clientBrief,
      createdAt: new Date().toISOString(),
    };
    if (args.depositAmount <= 0) {
      project.status = "ACTIVE";
      if (project.phases[0]) project.phases[0].status = "IN_PROGRESS";
    }
    return project;
  }

  function approveProjectRequest(
    requestId: string,
    payload: {
      totalAmount: number;
      depositAmount: number;
      balanceAmount: number;
      projectManagerId?: string;
      targetDate?: string;
      internalNotes?: string;
    },
  ) {
    let createdId = "";
    setState((prev) => {
      const request = prev.requests.find((item) => item.id === requestId);
      if (!request) return prev;
      const client = prev.users.find((user) => user.id === request.clientId);
      const template =
        prev.templates.find(
          (item) => item.packageType === request.packageType,
        ) ?? prev.templates[0];
      const code = makeProjectCode();
      const projectId = makeId("project");
      const phases = template.phases.map((phase, index) => {
        const phaseId = `${projectId}_phase_${index + 1}`;
        return {
          id: phaseId,
          projectId,
          phaseNumber: index + 1,
          title: phase.title,
          description: phase.description,
          status: "LOCKED" as PhaseStatus,
          assignedStaffId: undefined,
          deliverables: phase.deliverables.map((name, deliverableIndex) => ({
            id: `${phaseId}_del_${deliverableIndex + 1}`,
            phaseId,
            name,
            status: "DRAFT" as const,
            visibleToClient: false,
          })),
          messages: [],
        };
      });
      const project: Project = {
        id: projectId,
        clientId: request.clientId,
        title: request.projectName,
        businessName: request.businessName,
        clientEmail: client?.email ?? "client@company.com",
        packageType: request.packageType,
        status: "APPROVED_AWAITING_DEPOSIT",
        targetDate: payload.targetDate,
        projectCode: code,
        projectManagerId: payload.projectManagerId,
        totalAmount: payload.totalAmount,
        depositAmount: payload.depositAmount,
        balanceAmount: payload.balanceAmount,
        phases,
        payments: [
          {
            id: makeId("pay"),
            projectId,
            type: "DEPOSIT",
            amount: payload.depositAmount,
            status: "UNPAID",
            reference: `OCT-${code}-DEP`,
            bankName: "Octalve Bank",
            accountName: "Octalve Consult",
            accountNumber: "0000000000",
          },
          {
            id: makeId("pay"),
            projectId,
            type: "BALANCE",
            amount: payload.balanceAmount,
            status: "UNPAID",
            reference: `OCT-${code}-BAL`,
            bankName: "Octalve Bank",
            accountName: "Octalve Consult",
            accountNumber: "0000000000",
          },
        ],
        internalNotes: payload.internalNotes,
        clientBrief: `${request.projectGoal}\n${request.projectDescription}`,
        createdAt: new Date().toISOString(),
      };
      createdId = project.id;
      return {
        ...prev,
        requests: prev.requests.map((item) =>
          item.id === requestId ? { ...item, status: "APPROVED" } : item,
        ),
        projects: [project, ...prev.projects],
        notifications: [
          notificationForRole(
            "CLIENT",
            "Project approved",
            `${project.title} has been approved. Deposit payment is required.`,
            "/client/payments",
          ),
          ...prev.notifications,
        ],
      };
    });
    return createdId;
  }

  function createAdminProject(payload: {
    packageType: PackageType;
    templateId: string;
    title: string;
    clientName: string;
    clientEmail: string;
    targetDate?: string;
    totalAmount: number;
    depositAmount: number;
    balanceAmount: number;
    projectManagerId?: string;
    internalNotes?: string;
  }) {
    let createdId = "";
    setState((prev) => {
      let client = prev.users.find(
        (user) =>
          user.email.toLowerCase() === payload.clientEmail.toLowerCase(),
      );
      const users = [...prev.users];
      if (!client) {
        client = {
          id: makeId("client"),
          name: payload.clientName,
          email: payload.clientEmail,
          company: payload.clientName,
          role: "CLIENT",
        };
        users.push(client);
      }
      const tempState = state;
      const template =
        tempState.templates.find((item) => item.id === payload.templateId) ??
        tempState.templates.find(
          (item) => item.packageType === payload.packageType,
        ) ??
        tempState.templates[0];
      const projectId = makeId("project");
      const code = makeProjectCode();
      const phases = template.phases.map((phase, index) => {
        const phaseId = `${projectId}_phase_${index + 1}`;
        return {
          id: phaseId,
          projectId,
          phaseNumber: index + 1,
          title: phase.title,
          description: phase.description,
          status: "LOCKED" as PhaseStatus,
          deliverables: phase.deliverables.map((name, deliverableIndex) => ({
            id: `${phaseId}_del_${deliverableIndex + 1}`,
            phaseId,
            name,
            status: "DRAFT" as const,
            visibleToClient: false,
          })),
          messages: [],
        };
      });
      const project: Project = {
        id: projectId,
        clientId: client.id,
        title: payload.title,
        businessName: payload.clientName,
        clientEmail: payload.clientEmail,
        packageType: payload.packageType,
        status: "APPROVED_AWAITING_DEPOSIT",
        targetDate: payload.targetDate,
        projectCode: code,
        projectManagerId: payload.projectManagerId,
        totalAmount: payload.totalAmount,
        depositAmount: payload.depositAmount,
        balanceAmount: payload.balanceAmount,
        phases,
        payments: [
          {
            id: makeId("pay"),
            projectId,
            type: "DEPOSIT",
            amount: payload.depositAmount,
            status: "UNPAID",
            reference: `OCT-${code}-DEP`,
            bankName: "Octalve Bank",
            accountName: "Octalve Consult",
            accountNumber: "0000000000",
          },
          {
            id: makeId("pay"),
            projectId,
            type: "BALANCE",
            amount: payload.balanceAmount,
            status: "UNPAID",
            reference: `OCT-${code}-BAL`,
            bankName: "Octalve Bank",
            accountName: "Octalve Consult",
            accountNumber: "0000000000",
          },
        ],
        internalNotes: payload.internalNotes,
        createdAt: new Date().toISOString(),
      };
      createdId = project.id;
      return { ...prev, users, projects: [project, ...prev.projects] };
    });
    return createdId;
  }

  function createTemplate(payload: Omit<ProjectTemplate, "id">) {
    const id = makeId("tpl");
    setState((prev) => ({
      ...prev,
      templates: [
        { ...payload, id, phases: normaliseTemplatePhases(payload.phases) },
        ...prev.templates,
      ],
    }));
    return id;
  }

  function updateTemplate(
    templateId: string,
    payload: Partial<Omit<ProjectTemplate, "id">>,
  ) {
    setState((prev) => ({
      ...prev,
      templates: prev.templates.map((template) =>
        template.id === templateId
          ? {
              ...template,
              ...payload,
              phases: payload.phases
                ? normaliseTemplatePhases(payload.phases)
                : template.phases,
            }
          : template,
      ),
    }));
  }

  function deleteTemplate(templateId: string) {
    setState((prev) => ({
      ...prev,
      templates: prev.templates.filter(
        (template) => template.id !== templateId,
      ),
    }));
  }

  function createTeamMember(payload: {
    name: string;
    email: string;
    specialty: string;
    role: Role;
  }) {
    const id = makeId("team");
    setState((prev) => ({
      ...prev,
      users: [...prev.users, { id, ...payload }],
    }));
    return id;
  }

  function updateTeamMember(
    userId: string,
    payload: Partial<Pick<User, "name" | "email" | "specialty" | "role">>,
  ) {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((user) =>
        user.id === userId ? { ...user, ...payload } : user,
      ),
    }));
  }

  function deleteTeamMember(userId: string) {
    setState((prev) => ({
      ...prev,
      users: prev.users.filter((user) => user.id !== userId),
      projects: prev.projects.map((project) => ({
        ...project,
        projectManagerId:
          project.projectManagerId === userId
            ? undefined
            : project.projectManagerId,
        phases: project.phases.map((phase) =>
          phase.assignedStaffId === userId
            ? { ...phase, assignedStaffId: undefined }
            : phase,
        ),
      })),
    }));
  }

  function deleteProject(projectId: string) {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.filter((project) => project.id !== projectId),
    }));
  }

  function updatePayment(
    paymentId: string,
    fn: (payment: ProjectPayment, project: Project) => ProjectPayment,
  ) {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((project) => {
        if (!project.payments.some((payment) => payment.id === paymentId))
          return project;
        const payments = project.payments.map((payment) =>
          payment.id === paymentId ? fn(payment, project) : payment,
        );
        return { ...project, payments };
      }),
    }));
  }

  function markPaymentPaid(paymentId: string) {
    updatePayment(paymentId, (payment) => ({
      ...payment,
      status: "PENDING_CONFIRMATION",
      clientMarkedPaidAt: new Date().toISOString(),
    }));
    setState((prev) => ({
      ...prev,
      notifications: [
        notificationForRole(
          "SUPER_ADMIN",
          "Payment pending confirmation",
          "A client marked a manual payment as paid.",
          "/admin/payments",
        ),
        ...prev.notifications,
      ],
    }));
  }

  function confirmPayment(paymentId: string) {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((project) => {
        const payment = project.payments.find((item) => item.id === paymentId);
        if (!payment) return project;
        const payments = project.payments.map((item) =>
          item.id === paymentId
            ? {
                ...item,
                status: "CONFIRMED" as const,
                confirmedAt: new Date().toISOString(),
              }
            : item,
        );
        let nextProject = { ...project, payments };
        if (payment.type === "DEPOSIT") {
          nextProject.status = "ACTIVE";
          if (nextProject.phases[0]?.status === "LOCKED") {
            nextProject.phases = nextProject.phases.map((phase, index) =>
              index === 0 ? { ...phase, status: "IN_PROGRESS" } : phase,
            );
          }
        }
        if (
          payment.type === "BALANCE" &&
          project.status === "BALANCE_PENDING_CONFIRMATION"
        ) {
          nextProject.status = "ACTIVE";
          const finalIndex = nextProject.phases.length - 1;
          nextProject.phases = nextProject.phases.map((phase, index) =>
            index === finalIndex && phase.status === "LOCKED"
              ? { ...phase, status: "IN_PROGRESS" }
              : phase,
          );
        }
        return nextProject;
      }),
      notifications: [
        notificationForRole(
          "CLIENT",
          "Payment confirmed",
          "Your payment has been confirmed.",
          "/client",
        ),
        ...prev.notifications,
      ],
    }));
  }

  function rejectPayment(paymentId: string, note?: string) {
    updatePayment(paymentId, (payment) => ({
      ...payment,
      status: "REJECTED",
      note,
    }));
  }

  function updatePhase(
    phaseId: string,
    fn: (phase: ProjectPhase, project: Project) => ProjectPhase,
    projectFn?: (project: Project) => Project,
  ) {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((project) => {
        if (!project.phases.some((phase) => phase.id === phaseId))
          return project;
        const updated = {
          ...project,
          phases: project.phases.map((phase) =>
            phase.id === phaseId ? fn(phase, project) : phase,
          ),
        };
        return projectFn ? projectFn(updated) : updated;
      }),
    }));
  }

  function assignPhase(phaseId: string, staffId: string) {
    updatePhase(phaseId, (phase) => ({ ...phase, assignedStaffId: staffId }));
  }

  function addDeliverable(
    phaseId: string,
    payload: Pick<Deliverable, "name" | "description" | "link" | "linkType">,
  ) {
    updatePhase(phaseId, (phase) => ({
      ...phase,
      deliverables: [
        ...phase.deliverables,
        {
          id: makeId("del"),
          phaseId,
          name: payload.name,
          description: payload.description,
          link: payload.link,
          linkType: payload.linkType,
          status: "DRAFT",
          visibleToClient: false,
          submittedById: currentUser?.id,
        },
      ],
    }));
  }

  function requestPhaseApproval(phaseId: string) {
    updatePhase(phaseId, (phase) => ({
      ...phase,
      status: "AWAITING_APPROVAL",
      approvalRequestedAt: new Date().toISOString(),
      deliverables: phase.deliverables.map((deliverable) => ({
        ...deliverable,
        status:
          deliverable.status === "APPROVED" ? "APPROVED" : "READY_FOR_REVIEW",
        visibleToClient: true,
      })),
      messages: [
        ...phase.messages,
        {
          id: makeId("msg"),
          phaseId,
          senderName: "System",
          senderRole: "SYSTEM",
          message: "Approval requested for this phase",
          createdAt: new Date().toISOString(),
          type: "SYSTEM",
        },
      ],
    }));
    setState((prev) => ({
      ...prev,
      notifications: [
        notificationForRole(
          "CLIENT",
          "Phase approval requested",
          "A project phase is ready for your review.",
          "/client/approvals",
        ),
        ...prev.notifications,
      ],
    }));
  }

  function approvePhase(phaseId: string) {
    updatePhase(
      phaseId,
      (phase) => ({
        ...phase,
        status: "APPROVED",
        approvedAt: new Date().toISOString(),
        deliverables: phase.deliverables.map((deliverable) => ({
          ...deliverable,
          status: "APPROVED",
          visibleToClient: true,
        })),
        messages: [
          ...phase.messages,
          {
            id: makeId("msg"),
            phaseId,
            senderName: currentUser?.name ?? "Client",
            senderRole: currentUser?.role ?? "CLIENT",
            message: `${currentUser?.name ?? "Client"} approved this phase`,
            createdAt: new Date().toISOString(),
            type: "SYSTEM",
          },
        ],
      }),
      (project) => {
        const index = project.phases.findIndex((phase) => phase.id === phaseId);
        const nextIndex = index + 1;
        const finalIndex = project.phases.length - 1;
        let nextProject = { ...project };
        if (nextIndex < project.phases.length) {
          if (nextIndex === finalIndex) {
            const balance = project.payments.find(
              (pay) => pay.type === "BALANCE",
            );
            if (
              balance &&
              balance.amount > 0 &&
              balance.status !== "CONFIRMED"
            ) {
              nextProject.status = "AWAITING_BALANCE";
            } else {
              nextProject.phases = nextProject.phases.map((phase, idx) =>
                idx === nextIndex && phase.status === "LOCKED"
                  ? { ...phase, status: "IN_PROGRESS" }
                  : phase,
              );
            }
          } else {
            nextProject.phases = nextProject.phases.map((phase, idx) =>
              idx === nextIndex && phase.status === "LOCKED"
                ? { ...phase, status: "IN_PROGRESS" }
                : phase,
            );
          }
        } else {
          nextProject.status = "COMPLETED";
        }
        return nextProject;
      },
    );
  }

  function requestChanges(phaseId: string, message: string) {
    updatePhase(phaseId, (phase) => ({
      ...phase,
      status: "CHANGES_REQUESTED",
      changeRequest: message,
      deliverables: phase.deliverables.map((deliverable) => ({
        ...deliverable,
        status: "NEEDS_CHANGES",
      })),
      messages: [
        ...phase.messages,
        {
          id: makeId("msg"),
          phaseId,
          senderName: currentUser?.name ?? "Client",
          senderRole: currentUser?.role ?? "CLIENT",
          message,
          createdAt: new Date().toISOString(),
          type: "MESSAGE",
        },
      ],
    }));
  }

  function sendPhaseMessage(phaseId: string, message: string) {
    if (!message.trim()) return;
    const msg: PhaseMessage = {
      id: makeId("msg"),
      phaseId,
      senderId: currentUser?.id,
      senderName: currentUser?.name ?? "User",
      senderRole: currentUser?.role ?? "CLIENT",
      message,
      createdAt: new Date().toISOString(),
      type: "MESSAGE",
    };
    updatePhase(phaseId, (phase) => ({
      ...phase,
      messages: [...phase.messages, msg],
    }));
  }

  function addReview(
    projectId: string,
    rating: number,
    comment: string,
    permissionToPublish: boolean,
  ) {
    const review = {
      id: makeId("review"),
      projectId,
      clientId: currentUser?.id ?? "client_hello",
      rating,
      comment,
      permissionToPublish,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, reviews: [review, ...prev.reviews] }));
  }

  const value: AppContextValue = {
    state,
    currentUser,
    sessionLoading,
    selectedProjectId: selectedProject?.id,
    selectedProject,
    clientProjects,
    logout,
    setSelectedProjectId,
    resetDemo,
    createProjectRequest,
    approveProjectRequest,
    createAdminProject,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
    deleteProject,
    markPaymentPaid,
    confirmPayment,
    rejectPayment,
    assignPhase,
    addDeliverable,
    requestPhaseApproval,
    approvePhase,
    requestChanges,
    sendPhaseMessage,
    addReview,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import {
  AppState,
  Deliverable,
  PackageType,
  Project,
  ProjectPhase,
  ProjectRequest,
  ProjectTemplate,
  Role,
  User,
} from "@/lib/types";

const SELECTED_PROJECT_KEY = "octalve-suite-selected-project-v2";

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
  ) => Promise<string>;
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
  ) => Promise<string>;
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
  }) => Promise<string>;
  createTemplate: (payload: Omit<ProjectTemplate, "id">) => Promise<string>;
  updateTemplate: (
    templateId: string,
    payload: Partial<Omit<ProjectTemplate, "id">>,
  ) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  createTeamMember: (payload: {
    name: string;
    email: string;
    specialty: string;
    role: Role;
  }) => Promise<string>;
  updateTeamMember: (
    userId: string,
    payload: Partial<Pick<User, "name" | "email" | "specialty" | "role">>,
  ) => Promise<void>;
  deleteTeamMember: (userId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  markPaymentPaid: (paymentId: string) => Promise<void>;
  confirmPayment: (paymentId: string) => Promise<void>;
  rejectPayment: (paymentId: string, note?: string) => Promise<void>;
  assignPhase: (phaseId: string, staffId: string) => Promise<void>;
  addDeliverable: (
    phaseId: string,
    payload: Pick<Deliverable, "name" | "description" | "link" | "linkType">,
  ) => Promise<void>;
  requestPhaseApproval: (phaseId: string) => Promise<void>;
  approvePhase: (phaseId: string) => Promise<void>;
  requestChanges: (phaseId: string, message: string) => Promise<void>;
  sendPhaseMessage: (phaseId: string, message: string) => Promise<void>;
  addReview: (
    projectId: string,
    rating: number,
    comment: string,
    permissionToPublish: boolean,
  ) => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

const emptyState: AppState = {
  users: [],
  templates: [],
  projects: [],
  requests: [],
  reviews: [],
  notifications: [],
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AppState>(emptyState);
  const [selectedProjectId, setSelectedProjectIdState] = useState<
    string | undefined
  >(undefined);

  // ------- Better Auth session -------
  const { data: authSession, isPending: sessionLoading } =
    authClient.useSession();

  const currentUser: User | undefined = useMemo(() => {
    if (!authSession?.user) return undefined;
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

  // ------- Data Fetching -------
  const refresh = useCallback(async () => {
    if (!currentUser) return;

    try {
      // Parallel fetch for speed
      const [
        projects,
        templates,
        requests,
        reviews,
        notifications,
        team,
        clients,
      ] = await Promise.all([
        api.projects.list(),
        api.templates.list(),
        currentUser.role === "SUPER_ADMIN" ? api.projectRequests.list() : Promise.resolve([]),
        api.reviews.list(),
        api.notifications.list(),
        (currentUser.role === "SUPER_ADMIN" || currentUser.role === "PROJECT_MANAGER") ? api.team.list() : Promise.resolve([]),
        currentUser.role === "SUPER_ADMIN" ? api.clients.list() : Promise.resolve([]),
      ]);

      setState({
        users: [...team, ...clients], // Combine team and clients for the 'users' list
        templates,
        projects,
        requests: requests as ProjectRequest[],
        reviews,
        notifications,
      });
    } catch (error) {
      console.error("Failed to fetch app state:", error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      refresh();
    }
  }, [currentUser, refresh]);

  // Load selected project ID from storage
  useEffect(() => {
    const selected = localStorage.getItem(SELECTED_PROJECT_KEY);
    if (selected) setSelectedProjectIdState(selected);
  }, []);

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
      setSelectedProjectId(selectedProject.id);
    }
  }, [selectedProject?.id, selectedProjectId]);

  // ------- Authentication -------
  async function logout() {
    const pathname = window.location.pathname;
    const isProtected =
      pathname.startsWith("/admin") ||
      pathname.startsWith("/staff") ||
      pathname.startsWith("/client");

    await authClient.signOut();
    setState(emptyState);
    setSelectedProjectIdState(undefined);
    try {
      localStorage.removeItem(SELECTED_PROJECT_KEY);
    } catch {}

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
    // No-op or call a destructive "clear my data" endpoint if needed.
    // For now, we'll just refresh.
    refresh();
  }

  // ------- Mutations -------

  async function createProjectRequest(
    payload: Omit<ProjectRequest, "id" | "clientId" | "status" | "createdAt">,
  ) {
    const res = await api.projectRequests.create(payload);
    await refresh();
    return res.id;
  }

  async function approveProjectRequest(
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
    const res = await api.projectRequests.approve(requestId, payload);
    await refresh();
    return res.id;
  }

  async function createAdminProject(payload: {
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
    const res = await api.projects.create(payload);
    await refresh();
    return res.id;
  }

  async function createTemplate(payload: Omit<ProjectTemplate, "id">) {
    const res = await api.templates.create(payload);
    await refresh();
    return res.id;
  }

  async function updateTemplate(
    templateId: string,
    payload: Partial<Omit<ProjectTemplate, "id">>,
  ) {
    await api.templates.update(templateId, payload);
    await refresh();
  }

  async function deleteTemplate(templateId: string) {
    await api.templates.delete(templateId);
    await refresh();
  }

  async function createTeamMember(payload: {
    name: string;
    email: string;
    specialty: string;
    role: Role;
  }) {
    const res = await api.team.create(payload);
    await refresh();
    return res.id;
  }

  async function updateTeamMember(
    userId: string,
    payload: Partial<Pick<User, "name" | "email" | "specialty" | "role">>,
  ) {
    await api.team.update(userId, payload);
    await refresh();
  }

  async function deleteTeamMember(userId: string) {
    await api.team.delete(userId);
    await refresh();
  }

  async function deleteProject(projectId: string) {
    await api.projects.delete(projectId);
    await refresh();
  }

  async function markPaymentPaid(paymentId: string) {
    await api.payments.markPaid(paymentId);
    await refresh();
  }

  async function confirmPayment(paymentId: string) {
    await api.payments.confirm(paymentId);
    await refresh();
  }

  async function rejectPayment(paymentId: string, note?: string) {
    await api.payments.reject(paymentId, note);
    await refresh();
  }

  async function assignPhase(phaseId: string, staffId: string) {
    await api.phases.assign(phaseId, staffId);
    await refresh();
  }

  async function addDeliverable(
    phaseId: string,
    payload: Pick<Deliverable, "name" | "description" | "link" | "linkType">,
  ) {
    await api.phases.addDeliverable(phaseId, payload);
    await refresh();
  }

  async function requestPhaseApproval(phaseId: string) {
    await api.phases.requestApproval(phaseId);
    await refresh();
  }

  async function approvePhase(phaseId: string) {
    await api.phases.approve(phaseId);
    await refresh();
  }

  async function requestChanges(phaseId: string, message: string) {
    await api.phases.requestChanges(phaseId, message);
    await refresh();
  }

  async function sendPhaseMessage(phaseId: string, message: string) {
    await api.messages.send(phaseId, message);
    await refresh();
  }

  async function addReview(
    projectId: string,
    rating: number,
    comment: string,
    permissionToPublish: boolean,
  ) {
    await api.reviews.create({ projectId, rating, comment, permissionToPublish });
    await refresh();
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

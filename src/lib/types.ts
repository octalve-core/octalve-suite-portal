export type Role = "CLIENT" | "STAFF" | "PROJECT_MANAGER" | "SUPER_ADMIN";
export type PackageType =
  | "Launch"
  | "Impact"
  | "Growth"
  | "Partner"
  | "WebsiteStarter"
  | "WebsiteProBiz"
  | "WebsiteAdvance"
  | "BrandingStarter"
  | "BrandingProBiz"
  | "BrandingAdvance"
  | "LeapRegistration"
  | "Custom";
export type ProjectStatus =
  | "PENDING_REVIEW"
  | "APPROVED_AWAITING_DEPOSIT"
  | "DEPOSIT_PENDING_CONFIRMATION"
  | "ACTIVE"
  | "AWAITING_BALANCE"
  | "BALANCE_PENDING_CONFIRMATION"
  | "COMPLETED"
  | "REJECTED";
export type PhaseStatus = "LOCKED" | "NOT_STARTED" | "IN_PROGRESS" | "AWAITING_APPROVAL" | "CHANGES_REQUESTED" | "APPROVED";
export type DeliverableStatus = "DRAFT" | "READY_FOR_REVIEW" | "NEEDS_CHANGES" | "APPROVED";
export type PaymentStatus = "UNPAID" | "PENDING_CONFIRMATION" | "CONFIRMED" | "REJECTED";
export type PaymentType = "DEPOSIT" | "BALANCE";

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role: Role;
  specialty?: string;
};

export type TemplatePhase = {
  id: string;
  title: string;
  description: string;
  deliverables: string[];
};

export type ProjectTemplate = {
  id: string;
  name: string;
  packageType: PackageType;
  description: string;
  phases: TemplatePhase[];
};

export type Deliverable = {
  id: string;
  phaseId: string;
  name: string;
  description?: string;
  link?: string;
  linkType?: "Figma" | "Google Drive" | "Web Preview" | "Document" | "Other";
  status: DeliverableStatus;
  visibleToClient: boolean;
  submittedById?: string;
};

export type PhaseMessage = {
  id: string;
  phaseId: string;
  senderId?: string;
  senderName: string;
  senderRole: Role | "SYSTEM";
  message: string;
  createdAt: string;
  type: "MESSAGE" | "SYSTEM";
};

export type ProjectPhase = {
  id: string;
  projectId: string;
  phaseNumber: number;
  title: string;
  description: string;
  status: PhaseStatus;
  assignedStaffId?: string;
  deliverables: Deliverable[];
  messages: PhaseMessage[];
  approvalRequestedAt?: string;
  approvedAt?: string;
  changeRequest?: string;
};

export type ProjectPayment = {
  id: string;
  projectId: string;
  type: PaymentType;
  amount: number;
  status: PaymentStatus;
  reference: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  clientMarkedPaidAt?: string;
  confirmedAt?: string;
  note?: string;
};

export type Project = {
  id: string;
  clientId: string;
  title: string;
  businessName: string;
  clientEmail: string;
  packageType: PackageType;
  status: ProjectStatus;
  targetDate?: string;
  projectCode: string;
  projectManagerId?: string;
  totalAmount: number;
  depositAmount: number;
  balanceAmount: number;
  phases: ProjectPhase[];
  payments: ProjectPayment[];
  internalNotes?: string;
  clientBrief?: string;
  createdAt: string;
};

export type ProjectRequest = {
  id: string;
  clientId: string;
  packageType: PackageType;
  projectName: string;
  businessName: string;
  phone?: string;
  projectGoal: string;
  projectDescription: string;
  preferredTimeline?: string;
  additionalNotes?: string;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "INFO_REQUESTED";
  createdAt: string;
};

export type Review = {
  id: string;
  projectId: string;
  clientId: string;
  rating: number;
  comment: string;
  permissionToPublish: boolean;
  createdAt: string;
};

export type NotificationItem = {
  id: string;
  userId?: string;
  role?: Role;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
};

export type AppState = {
  users: User[];
  templates: ProjectTemplate[];
  projects: Project[];
  requests: ProjectRequest[];
  reviews: Review[];
  notifications: NotificationItem[];
};

import { AppState, ProjectPhase, ProjectTemplate } from "./types";

const now = new Date().toISOString();

export const templates: ProjectTemplate[] = [
  {
    id: "tpl_launch",
    name: "Standard Launch Package",
    packageType: "Launch",
    description: "Complete brand identity and website launch package",
    phases: [
      { id: "lp1", title: "Discovery & Strategy", description: "Initial research and brand strategy", deliverables: ["Brand Strategy Document", "Competitor Analysis", "Target Audience Personas"] },
      { id: "lp2", title: "Brand Identity", description: "Logo and visual identity development", deliverables: ["Logo Concepts", "Color System", "Brand Guidelines", "Social Media Kit"] },
      { id: "lp3", title: "Website Design", description: "UI direction and responsive website screens", deliverables: ["Homepage Design", "Inner Page Designs", "Mobile Screens"] },
      { id: "lp4", title: "Development", description: "Website build, integration and testing", deliverables: ["Frontend Build", "CMS/Forms", "Staging Preview"] },
      { id: "lp5", title: "Launch & Handoff", description: "Final launch, documentation and handoff", deliverables: ["Live Website", "Handoff Guide", "Support Notes"] }
    ]
  },
  {
    id: "tpl_impact",
    name: "Impact Marketing Suite",
    packageType: "Impact",
    description: "Comprehensive branding, campaign and market activation package",
    phases: [
      { id: "ip1", title: "Audit & Analysis", description: "Current state analysis and opportunity mapping", deliverables: ["Audit Report", "Audience Insights", "Opportunity Map"] },
      { id: "ip2", title: "Campaign Strategy", description: "Messaging, offers and campaign architecture", deliverables: ["Campaign Strategy", "Offer Map", "Content Calendar"] },
      { id: "ip3", title: "Content Creation", description: "Core campaign assets and copy", deliverables: ["Social Media Kit", "Marketing Copy", "Email Templates"] },
      { id: "ip4", title: "Reporting", description: "Campaign performance report and recommendations", deliverables: ["Performance Report", "Recommendations"] }
    ]
  },
  {
    id: "tpl_growth",
    name: "Growth Accelerator",
    packageType: "Growth",
    description: "Scale your business with advanced digital solutions",
    phases: [
      { id: "gp1", title: "Audit & Analysis", description: "Current state analysis", deliverables: ["Growth Audit", "Analytics Review", "Funnel Map"] },
      { id: "gp2", title: "Optimization", description: "Performance optimization", deliverables: ["Conversion Plan", "Channel Improvements", "Automation Map"] },
      { id: "gp3", title: "Expansion", description: "Feature expansion and new channels", deliverables: ["Expansion Plan", "New Channel Setup"] },
      { id: "gp4", title: "Scale & Support", description: "Scaling and ongoing support activities", deliverables: ["Scale Playbook", "Support Roadmap"] }
    ]
  },
  {
    id: "tpl_partner",
    name: "Partner Program",
    packageType: "Partner",
    description: "Full partnership with ongoing collaboration",
    phases: [
      { id: "pp1", title: "Onboarding", description: "Partnership setup and alignment", deliverables: ["Partnership Agreement", "Kickoff Presentation", "Project Roadmap"] },
      { id: "pp2", title: "Initial Projects", description: "First priority deliverables", deliverables: ["Priority Deliverables", "Monthly Workplan"] },
      { id: "pp3", title: "Ongoing Growth", description: "Continuous delivery and support", deliverables: ["Monthly Report", "Next Actions"] }
    ]
  }
];

const buildPhases = (projectId: string, templateId: string, statuses?: string[]): ProjectPhase[] => {
  const template = templates.find((item) => item.id === templateId) ?? templates[0];
  return template.phases.map((phase, index) => {
    const status = (statuses?.[index] as ProjectPhase["status"]) ?? (index === 0 ? "IN_PROGRESS" : "LOCKED");
    const phaseId = `${projectId}_phase_${index + 1}`;
    return {
      id: phaseId,
      projectId,
      phaseNumber: index + 1,
      title: phase.title,
      description: phase.description,
      status,
      assignedStaffId: index % 2 === 0 ? "staff_marcus" : "staff_emily",
      deliverables: phase.deliverables.map((name, deliverableIndex) => ({
        id: `${phaseId}_del_${deliverableIndex + 1}`,
        phaseId,
        name,
        description: deliverableIndex === 0 ? "Primary document for this phase." : undefined,
        link: deliverableIndex === 0 ? "https://example.com/preview" : undefined,
        linkType: deliverableIndex === 0 ? "Web Preview" : "Other",
        status: status === "APPROVED" ? "APPROVED" : status === "AWAITING_APPROVAL" ? "READY_FOR_REVIEW" : "DRAFT",
        visibleToClient: status === "AWAITING_APPROVAL" || status === "APPROVED"
      })),
      messages: status === "APPROVED" ? [
        {
          id: `${phaseId}_msg_1`,
          phaseId,
          senderName: "System",
          senderRole: "SYSTEM",
          message: "Approval requested for this phase",
          createdAt: now,
          type: "SYSTEM"
        },
        {
          id: `${phaseId}_msg_2`,
          phaseId,
          senderName: "hellobrandde",
          senderRole: "CLIENT",
          message: "hellobrandde approved this phase",
          createdAt: now,
          type: "SYSTEM"
        }
      ] : []
    };
  });
};

export const initialState: AppState = {
  users: [
    // { id: "admin_octa", name: "Octa Ive", email: "octalve0@gmail.com", company: "Octalve Team", role: "SUPER_ADMIN" },
    // { id: "pm_adedotun", name: "Adedotun Idowu", email: "aidowu@octalve.com", role: "PROJECT_MANAGER", specialty: "PM" },
    // { id: "staff_marcus", name: "Marcus Chen", email: "marcus@octalve.com", role: "STAFF", specialty: "Designer" },
    // { id: "staff_james", name: "James Wilson", email: "james@octalve.com", role: "STAFF", specialty: "Strategist" },
    // { id: "staff_emily", name: "Emily Rodriguez", email: "emily@octalve.com", role: "STAFF", specialty: "Developer" },
    // { id: "staff_lisa", name: "Lisa Park", email: "lisa@octalve.com", role: "STAFF", specialty: "Copywriter" },
    // { id: "client_hello", name: "hellobrandde", email: "hellobrandde@gmail.com", phone: "08000000000", company: "ChatGPT", role: "CLIENT" },
    // { id: "client_adecrown", name: "Adecrown", email: "adecrown@gmail.com", company: "Adecrown", role: "CLIENT" },
    // { id: "client_sfx", name: "SFx", email: "kolawolemuqaddis@gmail.com", company: "SFx", role: "CLIENT" }
  ],
  templates,
  projects: [
    {
      id: "project_chatgpt",
      clientId: "client_hello",
      title: "ChatGPT",
      businessName: "Octalve-Chatgpt",
      clientEmail: "hellobrandde@gmail.com",
      packageType: "Launch",
      status: "ACTIVE",
      targetDate: "May 9, 2026",
      projectCode: "3KRT26",
      projectManagerId: "pm_adedotun",
      totalAmount: 800000,
      depositAmount: 400000,
      balanceAmount: 400000,
      phases: buildPhases("project_chatgpt", "tpl_launch", ["APPROVED", "IN_PROGRESS", "LOCKED", "LOCKED", "LOCKED"]),
      payments: [
        { id: "pay_chatgpt_dep", projectId: "project_chatgpt", type: "DEPOSIT", amount: 400000, status: "CONFIRMED", reference: "OCT-3KRT26-DEP", bankName: "Octalve Bank", accountName: "Octalve Consult", accountNumber: "0000000000", confirmedAt: now },
        { id: "pay_chatgpt_bal", projectId: "project_chatgpt", type: "BALANCE", amount: 400000, status: "UNPAID", reference: "OCT-3KRT26-BAL", bankName: "Octalve Bank", accountName: "Octalve Consult", accountNumber: "0000000000" }
      ],
      clientBrief: "A clean launch project for an AI-related product experience.",
      createdAt: now
    },
    {
      id: "project_brandde",
      clientId: "client_hello",
      title: "Octalve Brandde",
      businessName: "Octalve Brandde",
      clientEmail: "hellobrandde@gmail.com",
      packageType: "Impact",
      status: "APPROVED_AWAITING_DEPOSIT",
      targetDate: "May 20, 2026",
      projectCode: "BRD920",
      projectManagerId: "pm_adedotun",
      totalAmount: 600000,
      depositAmount: 300000,
      balanceAmount: 300000,
      phases: buildPhases("project_brandde", "tpl_impact", ["LOCKED", "LOCKED", "LOCKED", "LOCKED"]),
      payments: [
        { id: "pay_brandde_dep", projectId: "project_brandde", type: "DEPOSIT", amount: 300000, status: "UNPAID", reference: "OCT-BRD920-DEP", bankName: "Octalve Bank", accountName: "Octalve Consult", accountNumber: "0000000000" },
        { id: "pay_brandde_bal", projectId: "project_brandde", type: "BALANCE", amount: 300000, status: "UNPAID", reference: "OCT-BRD920-BAL", bankName: "Octalve Bank", accountName: "Octalve Consult", accountNumber: "0000000000" }
      ],
      clientBrief: "Impact suite request for brand and marketing activation.",
      createdAt: now
    },
    {
      id: "project_sfx_money",
      clientId: "client_sfx",
      title: "SFx Money App",
      businessName: "SFx Money App",
      clientEmail: "kolawolemuqaddis@gmail.com",
      packageType: "Impact",
      status: "ACTIVE",
      targetDate: "Jan 15, 2026",
      projectCode: "SFX114",
      projectManagerId: "pm_adedotun",
      totalAmount: 1200000,
      depositAmount: 600000,
      balanceAmount: 600000,
      phases: buildPhases("project_sfx_money", "tpl_impact", ["APPROVED", "AWAITING_APPROVAL", "NOT_STARTED", "NOT_STARTED"]),
      payments: [
        { id: "pay_sfx_dep", projectId: "project_sfx_money", type: "DEPOSIT", amount: 600000, status: "CONFIRMED", reference: "OCT-SFX114-DEP", bankName: "Octalve Bank", accountName: "Octalve Consult", accountNumber: "0000000000", confirmedAt: now },
        { id: "pay_sfx_bal", projectId: "project_sfx_money", type: "BALANCE", amount: 600000, status: "UNPAID", reference: "OCT-SFX114-BAL", bankName: "Octalve Bank", accountName: "Octalve Consult", accountNumber: "0000000000" }
      ],
      clientBrief: "Money app brand, campaign and launch support.",
      createdAt: now
    },
    {
      id: "project_adecrown",
      clientId: "client_adecrown",
      title: "Octalve Lite",
      businessName: "Adecrown",
      clientEmail: "adecrown@gmail.com",
      packageType: "Growth",
      status: "ACTIVE",
      targetDate: "Jan 12, 2026",
      projectCode: "LITE01",
      projectManagerId: "pm_adedotun",
      totalAmount: 500000,
      depositAmount: 250000,
      balanceAmount: 250000,
      phases: buildPhases("project_adecrown", "tpl_growth", ["NOT_STARTED", "LOCKED", "LOCKED", "LOCKED"]),
      payments: [
        { id: "pay_lite_dep", projectId: "project_adecrown", type: "DEPOSIT", amount: 250000, status: "CONFIRMED", reference: "OCT-LITE01-DEP", bankName: "Octalve Bank", accountName: "Octalve Consult", accountNumber: "0000000000", confirmedAt: now }
      ],
      createdAt: now
    }
  ],
  requests: [
    {
      id: "req_001",
      clientId: "client_hello",
      packageType: "Growth",
      projectName: "AI Sales Assistant",
      businessName: "Hello Brandde",
      phone: "08000000000",
      projectGoal: "Automate lead response and client intake.",
      projectDescription: "We want a simple AI assistant that can qualify leads, answer common questions and recommend next steps.",
      preferredTimeline: "4 weeks",
      additionalNotes: "We need something clean and easy to manage.",
      status: "PENDING_REVIEW",
      createdAt: now
    }
  ],
  reviews: [],
  notifications: [
    { id: "not_1", role: "CLIENT", title: "Approval pending", body: "Discovery & Strategy is waiting for your review.", href: "/client/approvals", read: false, createdAt: now },
    { id: "not_2", role: "SUPER_ADMIN", title: "New project request", body: "AI Sales Assistant is waiting for review.", href: "/admin/project-requests", read: false, createdAt: now }
  ]
};

export function cloneInitialState(): AppState {
  return JSON.parse(JSON.stringify(initialState)) as AppState;
}

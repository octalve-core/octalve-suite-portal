import { PackageType, Project, ProjectRequest, ProjectTemplate } from "./types";

export function recommendPackage(goal: string): PackageType {
  const text = goal.toLowerCase();
  if (/(website|launch|startup|brand|logo|product)/.test(text)) return "Launch";
  if (/(campaign|marketing|content|sales|visibility|social)/.test(text)) return "Impact";
  if (/(scale|growth|automation|funnel|crm|leads|analytics)/.test(text)) return "Growth";
  if (/(ongoing|retainer|partner|long term|support)/.test(text)) return "Partner";
  return "Custom";
}

export function improveBrief(raw: string, businessName: string) {
  const packageType = recommendPackage(raw);
  return `Structured brief for ${businessName || "this project"}:\n\nGoal: ${raw || "Clarify the project objective and desired business outcome."}\n\nRecommended suite: ${packageType} Suite.\n\nSuggested focus:\n1. Clarify the business objective and target audience.\n2. Define the core deliverables needed to create traction.\n3. Agree on approval milestones, payment stages, and launch timeline.\n\nQuestions to confirm:\n- What result should this project achieve first?\n- What existing assets are available?\n- Who will approve each phase from the client side?`;
}

export function generateProjectSummary(project: Project) {
  const approved = project.phases.filter((phase) => phase.status === "APPROVED").length;
  const awaiting = project.phases.filter((phase) => phase.status === "AWAITING_APPROVAL").length;
  const active = project.phases.find((phase) => ["IN_PROGRESS", "AWAITING_APPROVAL", "CHANGES_REQUESTED"].includes(phase.status));
  const blockers = [];
  if (project.status === "APPROVED_AWAITING_DEPOSIT") blockers.push("deposit payment is required");
  if (project.status === "AWAITING_BALANCE") blockers.push("balance payment is required before final phase");
  if (awaiting > 0) blockers.push(`${awaiting} phase${awaiting > 1 ? "s" : ""} awaiting client approval`);
  return `${project.title}: ${approved}/${project.phases.length} phases approved. Current focus: ${active?.title ?? "no active phase"}. ${blockers.length ? `Blocker: ${blockers.join(", ")}.` : "No major blocker detected."}`;
}

export function generatePhasesFromRequest(request: ProjectRequest, templates: ProjectTemplate[]) {
  const recommended = recommendPackage(`${request.projectGoal} ${request.projectDescription}`);
  const template = templates.find((item) => item.packageType === recommended) ?? templates.find((item) => item.packageType === request.packageType) ?? templates[0];
  return template.phases.map((phase, index) => ({
    ...phase,
    title: phase.title,
    description: `${phase.description}. Tailored for ${request.businessName}.`,
    id: `ai_phase_${index + 1}`
  }));
}

export function assistantReply(prompt: string) {
  const text = prompt.toLowerCase();
  if (text.includes("payment") || text.includes("deposit") || text.includes("balance")) {
    return "For manual payment, the client opens Payments, copies the bank details, transfers, then clicks “I have paid”. Admin confirms from Admin → Payments before the project or final phase unlocks.";
  }
  if (text.includes("approve") || text.includes("approval")) {
    return "A project manager requests approval when a phase is ready. The client reviews deliverables, then either approves the phase or requests changes with a comment. Approval automatically unlocks the next phase, except the final phase which can require balance confirmation.";
  }
  if (text.includes("phase") || text.includes("deliverable")) {
    return "Each project contains phases. Each phase contains deliverables such as documents, Figma links, Google Drive links, or web previews. Staff works internally, PM reviews, then the client sees ready deliverables.";
  }
  if (text.includes("brief") || text.includes("package")) {
    return "Use the AI brief assistant during project creation. It can structure rough client text, recommend a suite, and suggest questions before admin approval.";
  }
  return "I can help with project briefs, package recommendation, phase planning, payment status, approvals, and delivery summaries inside Octalve Suite.";
}

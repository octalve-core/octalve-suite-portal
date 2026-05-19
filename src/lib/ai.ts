import { PackageType, Project, ProjectRequest, ProjectTemplate } from "./types";

const PACKAGE_TITLES: Record<PackageType, string> = {
  Launch: "Launch Suite",
  Impact: "Impact Suite",
  Growth: "Growth Suite",
  Partner: "Partner Suite",
  WebsiteStarter: "Website Dev. Starter",
  WebsiteProBiz: "Website Dev. Pro-Biz",
  WebsiteAdvance: "Website Dev. Advance",
  BrandingStarter: "Branding Starter",
  BrandingProBiz: "Branding Pro-Biz",
  BrandingAdvance: "Branding Advance",
  LeapRegistration: "Leap / Registration",
  Custom: "Custom",
};

export function getPackageTitleLocal(packageType: PackageType | string) {
  return PACKAGE_TITLES[packageType as PackageType] ?? String(packageType);
}

export function recommendPackage(goal: string): PackageType {
  const text = goal.toLowerCase();

  if (/(cac|registration|register|tin|compliance|licence|license|vat|tax)/.test(text)) {
    return "LeapRegistration";
  }

  if (/(brand|logo|identity|packaging|brochure|signage)/.test(text)) {
    return "BrandingProBiz";
  }

  if (/(advanced website|ecommerce|e-commerce|portal|dashboard|software|app|integration|web app)/.test(text)) {
    return "WebsiteAdvance";
  }

  if (/(website|web|landing|online presence|business site)/.test(text)) {
    return "WebsiteProBiz";
  }

  if (/(ngo|foundation|campaign|donation|impact|volunteer)/.test(text)) {
    return "Impact";
  }

  if (/(scale|growth|automation|funnel|crm|leads|analytics|sales system)/.test(text)) {
    return "Growth";
  }

  if (/(partner|retainer|ongoing|monthly|long term|collaboration)/.test(text)) {
    return "Partner";
  }

  return "Launch";
}

export function improveBrief(raw: string, businessName: string) {
  const packageType = recommendPackage(raw);
  const packageTitle = getPackageTitleLocal(packageType);

  return `Structured brief for ${businessName || "this project"}:\n\nGoal: ${
    raw || "Clarify the project objective and desired business outcome."
  }\n\nRecommended package: ${packageTitle}.\n\nSuggested focus:\n1. Clarify the business objective and target audience.\n2. Define the core deliverables needed to create traction.\n3. Agree on approval milestones, payment stages, and launch timeline.\n\nQuestions to confirm:\n- What result should this project achieve first?\n- What existing assets are available?\n- Who will approve each phase from the client side?`;
}

export function generateProjectSummary(project: Project) {
  const approved = project.phases.filter((phase) => phase.status === "APPROVED").length;
  const current =
    project.phases.find((phase) => phase.status === "IN_PROGRESS") ??
    project.phases.find((phase) => phase.status !== "APPROVED");

  return `${project.title} is ${project.status.toLowerCase().replaceAll("_", " ")} with ${approved}/${project.phases.length} phases approved. ${
    current ? `Current focus: ${current.title}.` : "All phases are complete."
  }`;
}

export function generatePhasesFromRequest(request: ProjectRequest, templates: ProjectTemplate[]) {
  const template =
    templates.find((item) => item.packageType === request.packageType) ??
    templates.find((item) => item.packageType === recommendPackage(`${request.projectGoal} ${request.projectDescription}`)) ??
    templates[0];

  return template.phases.map((phase, index) => ({
    ...phase,
    title: phase.title,
    description: `${phase.description}. Tailored for ${request.businessName}.`,
    status: index === 0 ? "IN_PROGRESS" : "LOCKED",
  }));
}
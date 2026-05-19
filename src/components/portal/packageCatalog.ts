import { type PackageType } from "@/lib/types";

export type PackageDeliverable = {
  title: string;
  description: string;
};

export type PackagePhase = {
  title: string;
  description: string;
  deliverables: PackageDeliverable[];
};

export type PackageCatalogItem = {
  type: PackageType;
  title: string;
  shortTitle: string;
  category: string;
  color: string;
  description: string;
  phases: PackagePhase[];
};

const brandDiscovery = {
  title: "Discovery & Direction",
  description: "Clarify the business, audience, positioning and expected outcome before execution begins.",
  deliverables: [
    {
      title: "Project intake summary",
      description: "A structured summary of the business goal, audience, offer, references and execution priorities.",
    },
    {
      title: "Direction note",
      description: "A clear creative or delivery direction to guide the rest of the project.",
    },
  ],
};

export const PACKAGE_CATALOG: PackageCatalogItem[] = [
  {
    type: "Launch",
    title: "Launch Suite",
    shortTitle: "Launch",
    category: "Suite",
    color: "#0064E0",
    description:
      "For businesses preparing a complete market-ready rollout with brand clarity, web presence and launch support.",
    phases: [
      brandDiscovery,
      {
        title: "Brand & Offer Structure",
        description: "Shape the brand presentation, core offer and launch message into a clearer market-facing structure.",
        deliverables: [
          { title: "Brand direction summary", description: "A concise direction document for identity, messaging and market positioning." },
          { title: "Offer clarity outline", description: "A practical outline of the offer, audience, promise and call-to-action." },
        ],
      },
      {
        title: "Website / Digital Presence",
        description: "Prepare the launch-facing digital experience required to build trust and drive enquiries.",
        deliverables: [
          { title: "Website structure", description: "Recommended pages, sections and conversion flow for the launch." },
          { title: "Launch content guide", description: "Content prompts for headline, service sections, proof and contact flow." },
        ],
      },
      {
        title: "Launch Assets",
        description: "Prepare the basic digital materials required to announce and support the launch.",
        deliverables: [
          { title: "Launch checklist", description: "A launch-readiness checklist covering brand, website, content and contact points." },
          { title: "Social launch direction", description: "Suggested launch announcement angles and visual content direction." },
        ],
      },
      {
        title: "Review & Handoff",
        description: "Confirm completion, document next steps and hand over the approved launch assets.",
        deliverables: [
          { title: "Final delivery summary", description: "A client-visible summary of completed work, approved items and pending recommendations." },
          { title: "Handoff note", description: "A clear guide for using the delivered assets after launch." },
        ],
      },
    ],
  },
  {
    type: "Impact",
    title: "Impact Suite",
    shortTitle: "Impact",
    category: "Suite",
    color: "#E61525",
    description:
      "For NGOs, campaigns and mission-driven organizations that need credibility, communication clarity and supporter readiness.",
    phases: [
      brandDiscovery,
      {
        title: "Mission & Audience Mapping",
        description: "Clarify the cause, target supporters, beneficiaries and campaign message.",
        deliverables: [
          { title: "Impact narrative", description: "A clear narrative explaining the mission, problem, solution and credibility angle." },
          { title: "Audience/supporter map", description: "A simple map of supporter groups, donor interests and communication priorities." },
        ],
      },
      {
        title: "Campaign Identity",
        description: "Create the communication and visual direction for the impact initiative.",
        deliverables: [
          { title: "Campaign message framework", description: "Core message pillars for awareness, trust and action." },
          { title: "Visual direction note", description: "Recommended visual treatment for social, web and campaign assets." },
        ],
      },
      {
        title: "Supporter-Ready Presence",
        description: "Prepare the structure for donation, volunteer, partnership or enquiry readiness.",
        deliverables: [
          { title: "Impact page structure", description: "Recommended sections for mission, proof, call-to-action and contact/donation readiness." },
          { title: "Trust proof checklist", description: "A checklist of documents, photos, testimonials or evidence needed to build credibility." },
        ],
      },
      {
        title: "Campaign Handoff",
        description: "Package the work into a usable campaign support system.",
        deliverables: [
          { title: "Campaign rollout checklist", description: "A practical checklist for public rollout and supporter communication." },
          { title: "Final impact delivery summary", description: "Summary of completed items, approved assets and next execution steps." },
        ],
      },
    ],
  },
  {
    type: "Growth",
    title: "Growth Suite",
    shortTitle: "Growth",
    category: "Suite",
    color: "#29BE3E",
    description:
      "For active businesses that need stronger sales structure, digital conversion flow and operational growth systems.",
    phases: [
      brandDiscovery,
      {
        title: "Growth Audit",
        description: "Review the current brand, website, offer, sales journey and operational gaps.",
        deliverables: [
          { title: "Growth audit note", description: "A structured review of visible gaps affecting trust, conversion and delivery." },
          { title: "Priority improvement list", description: "Ranked actions for clearer sales, better customer flow and stronger execution." },
        ],
      },
      {
        title: "Offer & Funnel Structure",
        description: "Clarify the offer, customer journey and conversion pathway.",
        deliverables: [
          { title: "Offer/funnel map", description: "A clear path from customer attention to enquiry, payment or booking." },
          { title: "Conversion copy direction", description: "Recommended message angles for homepage, landing pages, campaigns or sales materials." },
        ],
      },
      {
        title: "Systems & Automation Direction",
        description: "Plan the tools, forms, CRM or workflow improvements required to support growth.",
        deliverables: [
          { title: "System recommendation", description: "Suggested workflow, form, automation or CRM structure." },
          { title: "Operational handoff checklist", description: "A checklist for managing leads, approvals, payments or support more consistently." },
        ],
      },
      {
        title: "Growth Roadmap",
        description: "Package the recommendations into a focused next-step execution plan.",
        deliverables: [
          { title: "30-day growth action plan", description: "A clear roadmap for immediate improvement and implementation." },
          { title: "Final advisory summary", description: "Documented guidance for continued growth execution." },
        ],
      },
    ],
  },
  {
    type: "Partner",
    title: "Partner Suite",
    shortTitle: "Partner",
    category: "Suite",
    color: "#5300D9",
    description:
      "For ongoing execution support, strategic collaboration and managed improvement across digital projects.",
    phases: [
      brandDiscovery,
      {
        title: "Partnership Scope",
        description: "Define the long-term support scope, responsibilities and delivery rhythm.",
        deliverables: [
          { title: "Partnership scope note", description: "Clear scope for support, execution areas and expected collaboration model." },
          { title: "Monthly priority map", description: "A working map of immediate, medium-term and ongoing priorities." },
        ],
      },
      {
        title: "Execution System Setup",
        description: "Set up the structure for tasks, approvals, reporting and ongoing delivery.",
        deliverables: [
          { title: "Delivery workflow", description: "A working structure for requests, approvals, feedback and handoff." },
          { title: "Reporting structure", description: "Suggested reporting and review rhythm for visibility and accountability." },
        ],
      },
      {
        title: "Active Delivery",
        description: "Execute agreed digital, brand, website, content or system improvements.",
        deliverables: [
          { title: "Monthly delivery batch", description: "Documented completed items for the active delivery cycle." },
          { title: "Review notes", description: "Client-facing review notes for decisions, improvements and next actions." },
        ],
      },
      {
        title: "Optimization & Continuity",
        description: "Review outcomes and prepare the next support cycle.",
        deliverables: [
          { title: "Performance review", description: "Summary of what improved, what remains and what should happen next." },
          { title: "Next-cycle plan", description: "Prioritized plan for the next execution cycle." },
        ],
      },
    ],
  },
  {
    type: "WebsiteStarter",
    title: "Website Dev. Starter",
    shortTitle: "Website Starter",
    category: "Website",
    color: "#0064E0",
    description:
      "For a focused starter website or landing presence that helps a business look credible and ready for enquiries.",
    phases: [
      brandDiscovery,
      {
        title: "Website Structure",
        description: "Define the essential pages, sections and content flow.",
        deliverables: [
          { title: "Page structure", description: "Recommended starter pages and sections." },
          { title: "Content checklist", description: "List of text, images and brand assets needed from the client." },
        ],
      },
      {
        title: "UI Direction",
        description: "Prepare the visual direction for a clean, responsive business website.",
        deliverables: [
          { title: "Homepage direction", description: "Layout and section direction for the main page." },
          { title: "Responsive design note", description: "Guidance for desktop and mobile presentation." },
        ],
      },
      {
        title: "Development",
        description: "Build the approved starter website structure.",
        deliverables: [
          { title: "Responsive website build", description: "Starter website built for desktop and mobile viewing." },
          { title: "Contact/enquiry setup", description: "Basic contact or enquiry flow configured." },
        ],
      },
      {
        title: "Launch & Handoff",
        description: "Review, publish and hand over the website.",
        deliverables: [
          { title: "Launch checklist", description: "Final checks before launch." },
          { title: "Website handoff note", description: "Summary of pages, links and maintenance recommendations." },
        ],
      },
    ],
  },
  {
    type: "WebsiteProBiz",
    title: "Website Dev. Pro-Biz",
    shortTitle: "Website Pro-Biz",
    category: "Website",
    color: "#FC7E24",
    description:
      "For a complete business website with stronger structure, conversion flow and professional presentation.",
    phases: [
      brandDiscovery,
      {
        title: "Content & Conversion Planning",
        description: "Plan pages, sections, conversion goals and customer journey.",
        deliverables: [
          { title: "Sitemap and flow", description: "Structured page map and user journey." },
          { title: "Conversion content guide", description: "Guidance for headlines, proof, services and calls-to-action." },
        ],
      },
      {
        title: "Interface Design",
        description: "Design a polished business-facing website experience.",
        deliverables: [
          { title: "Key page UI direction", description: "Design direction for homepage and important inner pages." },
          { title: "Mobile experience direction", description: "Responsive behavior and mobile layout expectations." },
        ],
      },
      {
        title: "Development & Integrations",
        description: "Build the approved website and connect required forms or integrations.",
        deliverables: [
          { title: "Business website build", description: "Responsive website pages built and tested." },
          { title: "Form/integration setup", description: "Contact, booking, lead or enquiry forms configured where required." },
        ],
      },
      {
        title: "Testing & Launch",
        description: "Test the website, prepare launch and document handoff.",
        deliverables: [
          { title: "QA checklist", description: "Device, link, form and content checks." },
          { title: "Launch handoff", description: "Final website delivery summary and maintenance guidance." },
        ],
      },
    ],
  },
  {
    type: "WebsiteAdvance",
    title: "Website Dev. Advance",
    shortTitle: "Website Advance",
    category: "Website",
    color: "#29BE3E",
    description:
      "For advanced websites, e-commerce, landing pages, integrations or custom web experiences requiring deeper delivery.",
    phases: [
      brandDiscovery,
      {
        title: "Technical Scope",
        description: "Clarify features, integrations, user flows and technical requirements.",
        deliverables: [
          { title: "Feature scope", description: "Documented features, pages, roles and required functionality." },
          { title: "Integration checklist", description: "List of tools, APIs, payments, forms or external services needed." },
        ],
      },
      {
        title: "UX/UI Design",
        description: "Design core screens, states and responsive layouts.",
        deliverables: [
          { title: "Core screen designs", description: "Design direction for key screens or advanced pages." },
          { title: "User flow map", description: "Mapped journey for customers, admins or operational users." },
        ],
      },
      {
        title: "Build & Integration",
        description: "Implement the approved web experience and required connections.",
        deliverables: [
          { title: "Advanced website build", description: "Functional website or web experience implementation." },
          { title: "Integration setup", description: "Connected payments, forms, dashboards, CMS or third-party tools as scoped." },
        ],
      },
      {
        title: "QA, Launch & Documentation",
        description: "Test functionality, prepare deployment and hand over documentation.",
        deliverables: [
          { title: "Functional QA report", description: "Summary of tested features, issues and fixes." },
          { title: "Technical handoff note", description: "Documentation for access, usage and maintenance." },
        ],
      },
    ],
  },
  {
    type: "BrandingStarter",
    title: "Branding Starter",
    shortTitle: "Branding Starter",
    category: "Branding",
    color: "#E61525",
    description:
      "For a clean starter identity covering logo, visual direction, brand guide and essential business materials.",
    phases: [
      brandDiscovery,
      {
        title: "Logo Direction",
        description: "Create a clear visual direction for the logo and basic identity.",
        deliverables: [
          { title: "Logo concept direction", description: "Logo direction and presentation for review." },
          { title: "Brand voice direction", description: "Simple guidance on tone and message style." },
        ],
      },
      {
        title: "Identity System",
        description: "Prepare the core brand look and usage rules.",
        deliverables: [
          { title: "Brand guide / style guide", description: "Core colors, typography and logo usage guidance." },
          { title: "Visual identity basics", description: "Starter identity system for consistent presentation." },
        ],
      },
      {
        title: "Business Essentials",
        description: "Prepare the basic business materials needed for professional use.",
        deliverables: [
          { title: "Business card", description: "Business card design direction or final asset." },
          { title: "Letterhead", description: "Letterhead design direction or final asset." },
        ],
      },
      {
        title: "Final Handoff",
        description: "Package approved files and guide usage.",
        deliverables: [
          { title: "Final asset package", description: "Approved logo and brand assets prepared for use." },
          { title: "Usage note", description: "Short guide for applying the identity correctly." },
        ],
      },
    ],
  },
  {
    type: "BrandingProBiz",
    title: "Branding Pro-Biz",
    shortTitle: "Branding Pro-Biz",
    category: "Branding",
    color: "#FC7E24",
    description:
      "For a stronger brand system with stationery, social assets and more complete professional rollout.",
    phases: [
      brandDiscovery,
      {
        title: "Brand System Direction",
        description: "Clarify brand personality, message direction and visual rollout needs.",
        deliverables: [
          { title: "Brand system brief", description: "Structured brand direction for identity and rollout assets." },
          { title: "Visual rollout plan", description: "List of assets needed across digital and business use." },
        ],
      },
      {
        title: "Identity Refinement",
        description: "Develop a stronger logo and visual system.",
        deliverables: [
          { title: "Logo and identity presentation", description: "Refined logo/identity concepts presented for review." },
          { title: "Brand guide", description: "Color, typography, visual style and usage direction." },
        ],
      },
      {
        title: "Digital & Stationery Assets",
        description: "Prepare social and professional business materials.",
        deliverables: [
          { title: "Social covers and highlights", description: "Social media profile cover and highlight direction/assets." },
          { title: "Email header / presentation asset", description: "Professional header or presentation template support asset." },
        ],
      },
      {
        title: "Review & Handoff",
        description: "Finalize approved assets and provide usage guidance.",
        deliverables: [
          { title: "Final brand package", description: "Approved brand assets packaged for business use." },
          { title: "Handoff guide", description: "Guidance for using brand assets across digital and business materials." },
        ],
      },
    ],
  },
  {
    type: "BrandingAdvance",
    title: "Branding Advance",
    shortTitle: "Branding Advance",
    category: "Branding",
    color: "#5300D9",
    description:
      "For premium identity systems with deeper brand personality, packaging, brochure, signage and broader applications.",
    phases: [
      brandDiscovery,
      {
        title: "Brand Strategy & Personality",
        description: "Define deeper brand personality, positioning, tone and usage direction.",
        deliverables: [
          { title: "Brand personality note", description: "A soft profile of brand character, tone and market feel." },
          { title: "Strategic brand direction", description: "High-level positioning and rollout direction." },
        ],
      },
      {
        title: "Premium Identity System",
        description: "Develop a richer and more flexible identity system.",
        deliverables: [
          { title: "Advanced identity presentation", description: "Premium logo/identity direction and visual system." },
          { title: "Expanded style guide", description: "More complete guidance for brand usage and applications." },
        ],
      },
      {
        title: "Brand Applications",
        description: "Prepare broader usage assets for print, product or partnership contexts.",
        deliverables: [
          { title: "Packaging / brochure direction", description: "Packaging or brochure layout direction/assets as scoped." },
          { title: "Signage / optional motion direction", description: "Signage direction or optional logo animation guidance where required." },
        ],
      },
      {
        title: "Final System Handoff",
        description: "Package the full brand system for practical use.",
        deliverables: [
          { title: "Complete brand asset package", description: "Final files and application assets prepared for use." },
          { title: "Brand system handoff", description: "Documentation on how to apply the full identity system." },
        ],
      },
    ],
  },
  {
    type: "LeapRegistration",
    title: "Leap / Registration",
    shortTitle: "Leap",
    category: "Leap",
    color: "#0064E0",
    description:
      "For business registration, CAC/TIN readiness, compliance support and founder setup structure.",
    phases: [
      {
        title: "Business Setup Review",
        description: "Clarify business type, founder details, registration route and readiness requirements.",
        deliverables: [
          { title: "Registration intake checklist", description: "List of founder/business information and documents required." },
          { title: "Recommended setup path", description: "Suggested registration, tax or compliance direction." },
        ],
      },
      {
        title: "Registration & Documentation",
        description: "Support the business setup documentation process based on selected registration needs.",
        deliverables: [
          { title: "CAC/TIN readiness checklist", description: "Checklist for CAC certificate, status report, TIN or related documents." },
          { title: "Document tracking note", description: "Visible progress note for submitted, pending and completed documents." },
        ],
      },
      {
        title: "Compliance / Readiness Support",
        description: "Prepare the business for structured clients, banking, VAT or operational presentation where applicable.",
        deliverables: [
          { title: "Compliance support note", description: "TIN, VAT, bank-facing or HR document guidance depending on the scope." },
          { title: "Business readiness summary", description: "Summary of the setup status and next readiness steps." },
        ],
      },
      {
        title: "Founder Handoff",
        description: "Hand over completed setup items and recommended next steps.",
        deliverables: [
          { title: "Final setup summary", description: "Completed registration/compliance items and outstanding recommendations." },
          { title: "Founder next-step guide", description: "Practical guidance for using the documents and moving toward growth." },
        ],
      },
    ],
  },
  {
    type: "Custom",
    title: "Custom",
    shortTitle: "Custom",
    category: "Custom",
    color: "#5300D9",
    description:
      "For special projects that need a custom delivery structure, mixed services or a scope outside a standard package.",
    phases: [
      brandDiscovery,
      {
        title: "Custom Scope Mapping",
        description: "Define the unique project requirements, outputs, constraints and approval process.",
        deliverables: [
          { title: "Custom scope document", description: "Clear project boundaries, expected outputs and delivery assumptions." },
          { title: "Priority roadmap", description: "Recommended sequence of work based on importance and dependencies." },
        ],
      },
      {
        title: "Execution Plan",
        description: "Convert the custom scope into clear phases, tasks and review milestones.",
        deliverables: [
          { title: "Execution plan", description: "Structured delivery plan with milestones and responsibilities." },
          { title: "Approval checklist", description: "Clear review and decision points for the client." },
        ],
      },
      {
        title: "Delivery & Handoff",
        description: "Execute, review and hand over the agreed custom deliverables.",
        deliverables: [
          { title: "Custom delivery batch", description: "Completed outputs based on the approved scope." },
          { title: "Final handoff note", description: "Summary of completed work and recommended next steps." },
        ],
      },
    ],
  },
];

export function getPackageCatalogItem(packageType?: string) {
  return (
    PACKAGE_CATALOG.find((item) => item.type === packageType) ??
    PACKAGE_CATALOG[0]
  );
}

export function getPackageTitle(packageType?: string) {
  return getPackageCatalogItem(packageType).title;
}

export function getPackagePhases(packageType?: string) {
  return getPackageCatalogItem(packageType).phases;
}
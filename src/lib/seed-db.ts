/**
 * Production-safe database bootstrap.
 *
 * This script intentionally does NOT create user accounts, client projects,
 * project requests, payment records, reviews, or notifications.
 *
 * It only creates missing default project templates when deliberately run.
 *
 * Run intentionally with:
 *   pnpm db:seed
 *
 * Production protection:
 *   - Requires ALLOW_DATABASE_SEED=true.
 *   - In NODE_ENV=production, also requires ALLOW_PRODUCTION_TEMPLATE_SEED=true.
 */
import "dotenv/config";

import { PackageType } from "@prisma/client";
import { prisma } from "./prisma";

type TemplateBootstrap = {
  name: string;
  packageType: PackageType;
  description: string;
  phases: {
    title: string;
    description: string;
    deliverables: string[];
  }[];
};

const TEMPLATE_BOOTSTRAP: TemplateBootstrap[] = [
  {
    name: "Standard Launch Package",
    packageType: "Launch",
    description: "Complete brand identity and website launch package.",
    phases: [
      {
        title: "Discovery & Strategy",
        description: "Initial research, positioning, requirements, and brand strategy.",
        deliverables: ["Brand Strategy Document", "Competitor Analysis", "Target Audience Personas"],
      },
      {
        title: "Brand Identity",
        description: "Logo direction, visual identity, and brand system development.",
        deliverables: ["Logo Concepts", "Color System", "Brand Guidelines", "Social Media Kit"],
      },
      {
        title: "Website Design",
        description: "UI direction and responsive website screens.",
        deliverables: ["Homepage Design", "Inner Page Designs", "Mobile Screens"],
      },
      {
        title: "Development",
        description: "Website build, integration, and testing.",
        deliverables: ["Frontend Build", "CMS/Forms", "Staging Preview"],
      },
      {
        title: "Launch & Handoff",
        description: "Final launch, documentation, and delivery handoff.",
        deliverables: ["Live Website", "Handoff Guide", "Support Notes"],
      },
    ],
  },
  {
    name: "Impact Marketing Suite",
    packageType: "Impact",
    description: "Comprehensive branding, campaign, and market activation package.",
    phases: [
      {
        title: "Audit & Analysis",
        description: "Current state analysis and opportunity mapping.",
        deliverables: ["Audit Report", "Audience Insights", "Opportunity Map"],
      },
      {
        title: "Campaign Strategy",
        description: "Messaging, offers, and campaign architecture.",
        deliverables: ["Campaign Strategy", "Offer Map", "Content Calendar"],
      },
      {
        title: "Content Creation",
        description: "Core campaign assets and copy.",
        deliverables: ["Social Media Kit", "Marketing Copy", "Email Templates"],
      },
      {
        title: "Reporting",
        description: "Campaign performance report and recommendations.",
        deliverables: ["Performance Report", "Recommendations"],
      },
    ],
  },
  {
    name: "Growth Accelerator",
    packageType: "Growth",
    description: "Growth optimization package for improving visibility, conversion, and systems.",
    phases: [
      {
        title: "Audit & Analysis",
        description: "Current state analysis and growth opportunity review.",
        deliverables: ["Growth Audit", "Analytics Review", "Funnel Map"],
      },
      {
        title: "Optimization",
        description: "Performance optimization across channels and conversion points.",
        deliverables: ["Conversion Plan", "Channel Improvements", "Automation Map"],
      },
      {
        title: "Expansion",
        description: "Feature expansion and new channel activation.",
        deliverables: ["Expansion Plan", "New Channel Setup"],
      },
      {
        title: "Scale & Support",
        description: "Scaling and ongoing support activities.",
        deliverables: ["Scale Playbook", "Support Roadmap"],
      },
    ],
  },
  {
    name: "Partner Program",
    packageType: "Partner",
    description: "Partnership workflow for ongoing collaboration and delivery support.",
    phases: [
      {
        title: "Onboarding",
        description: "Partnership setup and alignment.",
        deliverables: ["Partnership Agreement", "Kickoff Presentation", "Project Roadmap"],
      },
      {
        title: "Initial Projects",
        description: "First priority deliverables and execution rhythm.",
        deliverables: ["Priority Deliverables", "Monthly Workplan"],
      },
      {
        title: "Ongoing Growth",
        description: "Continuous delivery, reporting, and support.",
        deliverables: ["Monthly Report", "Next Actions"],
      },
    ],
  },
];

async function seedMissingTemplates() {
  console.log("Checking missing project templates...");

  for (const template of TEMPLATE_BOOTSTRAP) {
    const existing = await prisma.projectTemplate.findFirst({
      where: {
        packageType: template.packageType,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        packageType: true,
      },
    });

    if (existing) {
      console.log(`SKIP ${template.packageType}: active template already exists (${existing.name}).`);
      continue;
    }

    await prisma.projectTemplate.create({
      data: {
        name: template.name,
        packageType: template.packageType,
        description: template.description,
        isActive: true,
        phases: {
          create: template.phases.map((phase, phaseIndex) => ({
            order: phaseIndex + 1,
            title: phase.title,
            description: phase.description,
            deliverables: {
              create: phase.deliverables.map((name, deliverableIndex) => ({
                name,
                order: deliverableIndex + 1,
              })),
            },
          })),
        },
      },
    });

    console.log(`CREATE ${template.packageType}: ${template.name}`);
  }
}

async function main() {
  if (process.env.ALLOW_DATABASE_SEED !== "true") {
    console.error("Database bootstrap blocked. Set ALLOW_DATABASE_SEED=true to run intentionally.");
    process.exit(1);
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_PRODUCTION_TEMPLATE_SEED !== "true"
  ) {
    console.error(
      "Production template bootstrap blocked. Set ALLOW_PRODUCTION_TEMPLATE_SEED=true only if you intentionally want to create missing default templates in production.",
    );
    process.exit(1);
  }

  console.log("Starting production-safe database bootstrap...");
  await seedMissingTemplates();
  console.log("Database bootstrap complete.");

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("Database bootstrap failed:", error);
  await prisma.$disconnect();
  process.exit(1);
});
/**
 * Database seed script — creates initial users, templates, projects, and demo data.
 *
 * Run with:  pnpm db:seed
 *            (or: npx tsx src/lib/seed-db.ts)
 */
import "dotenv/config";
import { auth } from "./auth";
import { prisma } from "./prisma";
import { Role, PackageType } from "@prisma/client";

// ─── Users ────────────────────────────────────────────────────────────────────

const SEED_USERS: {
  name: string;
  email: string;
  password: string;
  role: Role;
  company?: string;
  specialty?: string;
  phone?: string;
}[] = [
  {
    name: "Octa Ive",
    email: "octalve0@gmail.com",
    password: "OctalveAdmin2026!",
    role: "SUPER_ADMIN",
    company: "Octalve Team",
  },
  {
    name: "Adedotun Idowu",
    email: "aidowu@octalve.com",
    password: "OctalvePM2026!",
    role: "PROJECT_MANAGER",
    specialty: "PM",
  },
  {
    name: "Marcus Chen",
    email: "marcus@octalve.com",
    password: "OctalveStaff2026!",
    role: "STAFF",
    specialty: "Designer",
  },
  {
    name: "James Wilson",
    email: "james@octalve.com",
    password: "OctalveStaff2026!",
    role: "STAFF",
    specialty: "Strategist",
  },
  {
    name: "Emily Rodriguez",
    email: "emily@octalve.com",
    password: "OctalveStaff2026!",
    role: "STAFF",
    specialty: "Developer",
  },
  {
    name: "Lisa Park",
    email: "lisa@octalve.com",
    password: "OctalveStaff2026!",
    role: "STAFF",
    specialty: "Copywriter",
  },
  {
    name: "hellobrandde",
    email: "hellobrandde@gmail.com",
    password: "ClientDemo2026!",
    role: "CLIENT",
    company: "ChatGPT",
    phone: "08000000000",
  },
  {
    name: "Adecrown",
    email: "adecrown@gmail.com",
    password: "ClientDemo2026!",
    role: "CLIENT",
    company: "Adecrown",
  },
  {
    name: "SFx",
    email: "kolawolemuqaddis@gmail.com",
    password: "ClientDemo2026!",
    role: "CLIENT",
    company: "SFx",
  },
];

// ─── Templates ────────────────────────────────────────────────────────────────

const SEED_TEMPLATES: {
  name: string;
  packageType: PackageType;
  description: string;
  phases: { title: string; description: string; deliverables: string[] }[];
}[] = [
  {
    name: "Standard Launch Package",
    packageType: "Launch",
    description: "Complete brand identity and website launch package",
    phases: [
      { title: "Discovery & Strategy", description: "Initial research and brand strategy", deliverables: ["Brand Strategy Document", "Competitor Analysis", "Target Audience Personas"] },
      { title: "Brand Identity", description: "Logo and visual identity development", deliverables: ["Logo Concepts", "Color System", "Brand Guidelines", "Social Media Kit"] },
      { title: "Website Design", description: "UI direction and responsive website screens", deliverables: ["Homepage Design", "Inner Page Designs", "Mobile Screens"] },
      { title: "Development", description: "Website build, integration and testing", deliverables: ["Frontend Build", "CMS/Forms", "Staging Preview"] },
      { title: "Launch & Handoff", description: "Final launch, documentation and handoff", deliverables: ["Live Website", "Handoff Guide", "Support Notes"] },
    ],
  },
  {
    name: "Impact Marketing Suite",
    packageType: "Impact",
    description: "Comprehensive branding, campaign and market activation package",
    phases: [
      { title: "Audit & Analysis", description: "Current state analysis and opportunity mapping", deliverables: ["Audit Report", "Audience Insights", "Opportunity Map"] },
      { title: "Campaign Strategy", description: "Messaging, offers and campaign architecture", deliverables: ["Campaign Strategy", "Offer Map", "Content Calendar"] },
      { title: "Content Creation", description: "Core campaign assets and copy", deliverables: ["Social Media Kit", "Marketing Copy", "Email Templates"] },
      { title: "Reporting", description: "Campaign performance report and recommendations", deliverables: ["Performance Report", "Recommendations"] },
    ],
  },
  {
    name: "Growth Accelerator",
    packageType: "Growth",
    description: "Scale your business with advanced digital solutions",
    phases: [
      { title: "Audit & Analysis", description: "Current state analysis", deliverables: ["Growth Audit", "Analytics Review", "Funnel Map"] },
      { title: "Optimization", description: "Performance optimization", deliverables: ["Conversion Plan", "Channel Improvements", "Automation Map"] },
      { title: "Expansion", description: "Feature expansion and new channels", deliverables: ["Expansion Plan", "New Channel Setup"] },
      { title: "Scale & Support", description: "Scaling and ongoing support activities", deliverables: ["Scale Playbook", "Support Roadmap"] },
    ],
  },
  {
    name: "Partner Program",
    packageType: "Partner",
    description: "Full partnership with ongoing collaboration",
    phases: [
      { title: "Onboarding", description: "Partnership setup and alignment", deliverables: ["Partnership Agreement", "Kickoff Presentation", "Project Roadmap"] },
      { title: "Initial Projects", description: "First priority deliverables", deliverables: ["Priority Deliverables", "Monthly Workplan"] },
      { title: "Ongoing Growth", description: "Continuous delivery and support", deliverables: ["Monthly Report", "Next Actions"] },
    ],
  },
];

// ─── Seed Functions ───────────────────────────────────────────────────────────

async function seedUsers() {
  console.log("👤 Seeding users...");

  for (const user of SEED_USERS) {
    try {
      const { name, email, password, role, ...additionalData } = user;

      await auth.api.signUpEmail({
        body: { name, email, password, ...additionalData },
      });

      await prisma.user.update({
        where: { email },
        data: { role },
      });

      console.log(`  ✅ ${role.padEnd(16)} ${email}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      if (message.includes("already") || message.includes("exists") || message.includes("unique") || message.includes("role is not allowed")) {
        try {
          await prisma.user.update({
            where: { email: user.email },
            data: { role: user.role },
          });
          console.log(`  ✅ ${user.role.padEnd(16)} ${user.email} (verified/updated)`);
        } catch (updateErr) {
          console.error(`  ❌ ${user.role.padEnd(16)} ${user.email} (update failed): ${updateErr}`);
        }
      } else {
        console.error(`  ❌ ${user.role.padEnd(16)} ${user.email}: ${message}`);
      }
    }
  }
}

async function seedTemplates() {
  console.log("\n📋 Seeding templates...");

  for (const tpl of SEED_TEMPLATES) {
    // Skip if a template with this packageType already exists
    const existing = await prisma.projectTemplate.findFirst({
      where: { packageType: tpl.packageType, isActive: true },
    });
    if (existing) {
      console.log(`  ⏭️  ${tpl.packageType.padEnd(10)} "${tpl.name}" (already exists)`);
      continue;
    }

    await prisma.projectTemplate.create({
      data: {
        name: tpl.name,
        packageType: tpl.packageType,
        description: tpl.description,
        phases: {
          create: tpl.phases.map((phase, idx) => ({
            order: idx + 1,
            title: phase.title,
            description: phase.description,
            deliverables: {
              create: phase.deliverables.map((name, dIdx) => ({
                name,
                order: dIdx + 1,
              })),
            },
          })),
        },
      },
    });

    console.log(`  ✅ ${tpl.packageType.padEnd(10)} "${tpl.name}" (${tpl.phases.length} phases)`);
  }
}

async function seedDemoProjects() {
  console.log("\n🏗️  Seeding demo projects...");

  // Look up real user IDs
  const clientHello = await prisma.user.findUnique({ where: { email: "hellobrandde@gmail.com" } });
  const clientSfx = await prisma.user.findUnique({ where: { email: "kolawolemuqaddis@gmail.com" } });
  const clientAdecrown = await prisma.user.findUnique({ where: { email: "adecrown@gmail.com" } });
  const pmAdedotun = await prisma.user.findUnique({ where: { email: "aidowu@octalve.com" } });
  const staffMarcus = await prisma.user.findUnique({ where: { email: "marcus@octalve.com" } });
  const staffEmily = await prisma.user.findUnique({ where: { email: "emily@octalve.com" } });

  if (!clientHello || !clientSfx || !clientAdecrown || !pmAdedotun) {
    console.log("  ⚠️  Skipping projects — required users not found. Run user seed first.");
    return;
  }

  // Skip if projects already exist
  const existingCount = await prisma.project.count();
  if (existingCount > 0) {
    console.log(`  ⏭️  ${existingCount} projects already exist, skipping.`);
    return;
  }

  const bankName = process.env.OCTALVE_BANK_NAME ?? "Octalve Bank";
  const accountName = process.env.OCTALVE_ACCOUNT_NAME ?? "Octalve Consult";
  const accountNumber = process.env.OCTALVE_ACCOUNT_NUMBER ?? "0000000000";

  // Get templates
  const launchTemplate = await prisma.projectTemplate.findFirst({
    where: { packageType: "Launch", isActive: true },
    include: { phases: { orderBy: { order: "asc" }, include: { deliverables: { orderBy: { order: "asc" } } } } },
  });
  const impactTemplate = await prisma.projectTemplate.findFirst({
    where: { packageType: "Impact", isActive: true },
    include: { phases: { orderBy: { order: "asc" }, include: { deliverables: { orderBy: { order: "asc" } } } } },
  });
  const growthTemplate = await prisma.projectTemplate.findFirst({
    where: { packageType: "Growth", isActive: true },
    include: { phases: { orderBy: { order: "asc" }, include: { deliverables: { orderBy: { order: "asc" } } } } },
  });

  if (!launchTemplate || !impactTemplate || !growthTemplate) {
    console.log("  ⚠️  Skipping projects — templates not found. Run template seed first.");
    return;
  }

  type PhaseStatusOverride = "LOCKED" | "NOT_STARTED" | "IN_PROGRESS" | "AWAITING_APPROVAL" | "APPROVED" | "CHANGES_REQUESTED";

  // Helper to create a project with phases from a template
  async function createProject(opts: {
    clientId: string;
    clientEmail: string;
    title: string;
    businessName: string;
    packageType: PackageType;
    code: string;
    totalAmount: number;
    depositAmount: number;
    balanceAmount: number;
    projectStatus: string;
    depositStatus: string;
    balanceStatus: string;
    clientBrief?: string;
    template: typeof launchTemplate;
    phaseStatuses: PhaseStatusOverride[];
    staffIds: (string | null)[];
  }) {
    const proj = await prisma.project.create({
      data: {
        clientId: opts.clientId,
        title: opts.title,
        businessName: opts.businessName,
        clientEmail: opts.clientEmail,
        packageType: opts.packageType,
        status: opts.projectStatus as any,
        targetDate: new Date("2026-06-15"),
        projectCode: opts.code,
        projectManagerId: pmAdedotun!.id,
        totalAmount: opts.totalAmount,
        depositAmount: opts.depositAmount,
        balanceAmount: opts.balanceAmount,
        clientBrief: opts.clientBrief ?? null,
      },
    });

    // Create phases with deliverables
    for (let i = 0; i < opts.template!.phases.length; i++) {
      const tPhase = opts.template!.phases[i];
      const phaseStatus = opts.phaseStatuses[i] ?? "LOCKED";
      const staffId = opts.staffIds[i % opts.staffIds.length];

      const phase = await prisma.projectPhase.create({
        data: {
          projectId: proj.id,
          phaseNumber: i + 1,
          title: tPhase.title,
          description: tPhase.description ?? "",
          status: phaseStatus,
          assignedStaffId: staffId,
          approvedAt: phaseStatus === "APPROVED" ? new Date() : null,
          approvalRequestedAt: phaseStatus === "AWAITING_APPROVAL" || phaseStatus === "APPROVED" ? new Date() : null,
        },
      });

      // Create deliverables
      for (const d of tPhase.deliverables) {
        const delStatus = phaseStatus === "APPROVED" ? "APPROVED" : phaseStatus === "AWAITING_APPROVAL" ? "READY_FOR_REVIEW" : "DRAFT";
        const visible = phaseStatus === "APPROVED" || phaseStatus === "AWAITING_APPROVAL";

        await prisma.deliverable.create({
          data: {
            phaseId: phase.id,
            name: d.name,
            status: delStatus,
            visibleToClient: visible,
            submittedById: staffId,
          },
        });
      }

      // Add system messages for approved phases
      if (phaseStatus === "APPROVED") {
        await prisma.phaseMessage.create({
          data: { phaseId: phase.id, senderName: "System", senderRole: "SYSTEM", message: "Approval requested for this phase", type: "SYSTEM" },
        });
        await prisma.phaseMessage.create({
          data: { phaseId: phase.id, senderId: opts.clientId, senderName: "Client", senderRole: "CLIENT", message: "Approved this phase", type: "SYSTEM" },
        });
      }
    }

    // Create payments
    await prisma.projectPayment.create({
      data: {
        projectId: proj.id,
        type: "DEPOSIT",
        amount: opts.depositAmount,
        status: opts.depositStatus as any,
        reference: `${opts.code}-DEP`,
        bankName, accountName, accountNumber,
        confirmedAt: opts.depositStatus === "CONFIRMED" ? new Date() : null,
      },
    });

    await prisma.projectPayment.create({
      data: {
        projectId: proj.id,
        type: "BALANCE",
        amount: opts.balanceAmount,
        status: opts.balanceStatus as any,
        reference: `${opts.code}-BAL`,
        bankName, accountName, accountNumber,
      },
    });

    console.log(`  ✅ "${opts.title}" (${opts.packageType}, ${opts.projectStatus})`);
    return proj;
  }

  // Project 1: Active Launch project with Phase 1 approved, Phase 2 in progress
  await createProject({
    clientId: clientHello.id,
    clientEmail: clientHello.email,
    title: "ChatGPT",
    businessName: "Octalve-Chatgpt",
    packageType: "Launch",
    code: "OCT-3KRT26",
    totalAmount: 800000,
    depositAmount: 400000,
    balanceAmount: 400000,
    projectStatus: "ACTIVE",
    depositStatus: "CONFIRMED",
    balanceStatus: "UNPAID",
    clientBrief: "A clean launch project for an AI-related product experience.",
    template: launchTemplate,
    phaseStatuses: ["APPROVED", "IN_PROGRESS", "LOCKED", "LOCKED", "LOCKED"],
    staffIds: [staffMarcus?.id ?? null, staffEmily?.id ?? null],
  });

  // Project 2: Awaiting deposit
  await createProject({
    clientId: clientHello.id,
    clientEmail: clientHello.email,
    title: "Octalve Brandde",
    businessName: "Octalve Brandde",
    packageType: "Impact",
    code: "OCT-BRD920",
    totalAmount: 600000,
    depositAmount: 300000,
    balanceAmount: 300000,
    projectStatus: "APPROVED_AWAITING_DEPOSIT",
    depositStatus: "UNPAID",
    balanceStatus: "UNPAID",
    clientBrief: "Impact suite request for brand and marketing activation.",
    template: impactTemplate,
    phaseStatuses: ["LOCKED", "LOCKED", "LOCKED", "LOCKED"],
    staffIds: [staffMarcus?.id ?? null, staffEmily?.id ?? null],
  });

  // Project 3: Active Impact project with phase awaiting approval
  await createProject({
    clientId: clientSfx.id,
    clientEmail: clientSfx.email,
    title: "SFx Money App",
    businessName: "SFx Money App",
    packageType: "Impact",
    code: "OCT-SFX114",
    totalAmount: 1200000,
    depositAmount: 600000,
    balanceAmount: 600000,
    projectStatus: "ACTIVE",
    depositStatus: "CONFIRMED",
    balanceStatus: "UNPAID",
    clientBrief: "Money app brand, campaign and launch support.",
    template: impactTemplate,
    phaseStatuses: ["APPROVED", "AWAITING_APPROVAL", "LOCKED", "LOCKED"],
    staffIds: [staffMarcus?.id ?? null, staffEmily?.id ?? null],
  });

  // Project 4: Active Growth project, early stage
  await createProject({
    clientId: clientAdecrown.id,
    clientEmail: clientAdecrown.email,
    title: "Octalve Lite",
    businessName: "Adecrown",
    packageType: "Growth",
    code: "OCT-LITE01",
    totalAmount: 500000,
    depositAmount: 250000,
    balanceAmount: 250000,
    projectStatus: "ACTIVE",
    depositStatus: "CONFIRMED",
    balanceStatus: "UNPAID",
    template: growthTemplate,
    phaseStatuses: ["IN_PROGRESS", "LOCKED", "LOCKED", "LOCKED"],
    staffIds: [staffMarcus?.id ?? null, staffEmily?.id ?? null],
  });
}

async function seedDemoRequest() {
  console.log("\n📨 Seeding demo project request...");

  const client = await prisma.user.findUnique({ where: { email: "hellobrandde@gmail.com" } });
  if (!client) { console.log("  ⚠️  Client not found, skipping."); return; }

  const existing = await prisma.projectRequest.count();
  if (existing > 0) { console.log(`  ⏭️  ${existing} requests already exist, skipping.`); return; }

  await prisma.projectRequest.create({
    data: {
      clientId: client.id,
      packageType: "Growth",
      projectName: "AI Sales Assistant",
      businessName: "Hello Brandde",
      phone: "08000000000",
      projectGoal: "Automate lead response and client intake.",
      projectDescription: "We want a simple AI assistant that can qualify leads, answer common questions and recommend next steps.",
      preferredTimeline: "4 weeks",
      additionalNotes: "We need something clean and easy to manage.",
      status: "PENDING_REVIEW",
    },
  });

  console.log(`  ✅ "AI Sales Assistant" (PENDING_REVIEW)`);
}

async function seedNotifications() {
  console.log("\n🔔 Seeding notifications...");

  const existing = await prisma.notification.count();
  if (existing > 0) { console.log(`  ⏭️  ${existing} notifications already exist, skipping.`); return; }

  await prisma.notification.createMany({
    data: [
      { role: "SUPER_ADMIN", title: "New project request", body: "AI Sales Assistant is waiting for review.", href: "/admin/project-requests" },
      { role: "CLIENT", title: "Approval pending", body: "A phase is waiting for your review.", href: "/client/approvals" },
    ],
  });

  console.log("  ✅ 2 notifications created");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Seeding database...\n");

  await seedUsers();
  await seedTemplates();
  await seedDemoProjects();
  await seedDemoRequest();
  await seedNotifications();

  console.log("\n🎉 Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

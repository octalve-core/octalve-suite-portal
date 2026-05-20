import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePaymentBankDetails } from "@/lib/payment-bank";
import { getSessionOrThrow, requireRoles, errorResponse, makeProjectCode, makePaymentRef } from "@/lib/api-helpers";
import type { Prisma } from "@prisma/client";

const projectIncludes = {
  phases: {
    orderBy: { phaseNumber: "asc" as const },
    include: {
      deliverables: { orderBy: { createdAt: "asc" as const } },
      messages: { orderBy: { createdAt: "asc" as const } },
    },
  },
  payments: true,
} satisfies Prisma.ProjectInclude;

/**
 * GET /api/projects — List projects filtered by role.
 */
export async function GET() {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const { user, role } = result;

  let where: Prisma.ProjectWhereInput = {};

  switch (role) {
    case "CLIENT":
      where = { clientId: user.id };
      break;
    case "STAFF":
      where = { phases: { some: { assignedStaffId: user.id } } };
      break;
    case "PROJECT_MANAGER":
      where = {
        OR: [
          { projectManagerId: user.id },
          { phases: { some: { assignedStaffId: user.id } } },
        ],
      };
      break;
    case "SUPER_ADMIN":
      // No filter — all projects
      break;
  }

  const projects = await prisma.project.findMany({
    where,
    include: projectIncludes,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

/**
 * POST /api/projects — Admin creates a project from a template.
 * Role: SUPER_ADMIN only.
 */
export async function POST(request: Request) {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;
  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const body = await request.json();
  const {
    packageType,
    templateId,
    title,
    clientName,
    clientEmail,
    targetDate,
    totalAmount,
    depositAmount,
    balanceAmount,
    projectManagerId,
    internalNotes,
  } = body;

  if (!title?.trim()) return errorResponse("Project title is required", 400);
  if (!clientEmail?.trim()) return errorResponse("Client email is required", 400);

  // Find template
  const template = templateId
    ? await prisma.projectTemplate.findUnique({
        where: { id: templateId },
        include: {
          phases: {
            orderBy: { order: "asc" },
            include: { deliverables: { orderBy: { order: "asc" } } },
          },
        },
      })
    : await prisma.projectTemplate.findFirst({
        where: { packageType: packageType ?? "Launch", isActive: true },
        include: {
          phases: {
            orderBy: { order: "asc" },
            include: { deliverables: { orderBy: { order: "asc" } } },
          },
        },
      });

  if (!template) return errorResponse("Template not found", 400);

  const code = makeProjectCode();
  const paymentBank = resolvePaymentBankDetails();

  const project = await prisma.$transaction(async (tx) => {
    // Find or create client user
    let client = await tx.user.findUnique({ where: { email: clientEmail.toLowerCase() } });
    if (!client) {
      client = await tx.user.create({
        data: {
          name: clientName ?? clientEmail.split("@")[0],
          email: clientEmail.toLowerCase(),
          role: "CLIENT",
          company: clientName ?? null,
        },
      });
    }

    // Create project
    const proj = await tx.project.create({
      data: {
        clientId: client.id,
        title: title.trim(),
        businessName: clientName ?? client.company ?? client.name,
        clientEmail: client.email,
        packageType: packageType ?? template.packageType,
        status: "APPROVED_AWAITING_DEPOSIT",
        targetDate: targetDate ? new Date(targetDate) : null,
        projectCode: code,
        projectManagerId: projectManagerId ?? null,
        totalAmount: totalAmount ?? 0,
        depositAmount: depositAmount ?? 0,
        balanceAmount: balanceAmount ?? 0,
        internalNotes: internalNotes ?? null,
      },
    });

    // Create phases with deliverables
    for (let i = 0; i < template.phases.length; i++) {
      const tPhase = template.phases[i];
      await tx.projectPhase.create({
        data: {
          projectId: proj.id,
          phaseNumber: i + 1,
          title: tPhase.title,
          description: tPhase.description ?? "",
          status: "LOCKED",
          deliverables: {
            create: tPhase.deliverables.map((d) => ({
              name: d.name,
              status: "DRAFT",
              visibleToClient: false,
            })),
          },
        },
      });
    }

    // Create payments
    await tx.projectPayment.createMany({
      data: [
        {
          projectId: proj.id,
          type: "DEPOSIT",
          amount: depositAmount ?? 0,
          status: "UNPAID",
          reference: makePaymentRef(code, "DEP"),
          bankName: paymentBank.bankName,
          accountName: paymentBank.accountName,
          accountNumber: paymentBank.accountNumber,
        },
        {
          projectId: proj.id,
          type: "BALANCE",
          amount: balanceAmount ?? 0,
          status: "UNPAID",
          reference: makePaymentRef(code, "BAL"),
          bankName: paymentBank.bankName,
          accountName: paymentBank.accountName,
          accountNumber: paymentBank.accountNumber,
        },
      ],
    });

    return proj;
  });

  const full = await prisma.project.findUnique({
    where: { id: project.id },
    include: projectIncludes,
  });

  return NextResponse.json(full, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePaymentBankDetails } from "@/lib/payment-bank";
import {
  getSessionOrThrow,
  requireRoles,
  errorResponse,
  makeProjectCode,
  makePaymentRef,
} from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

const projectIncludes = {
  phases: {
    orderBy: { phaseNumber: "asc" as const },
    include: {
      deliverables: { orderBy: { createdAt: "asc" as const } },
      messages: { orderBy: { createdAt: "asc" as const } },
    },
  },
  payments: true,
};

async function loadTemplateForRequest(projectRequest: {
  templateId?: string | null;
  packageType: string;
}) {
  const include = {
    phases: {
      orderBy: { order: "asc" as const },
      include: { deliverables: { orderBy: { order: "asc" as const } } },
    },
  };

  if (projectRequest.templateId) {
    const exactTemplate = await prisma.projectTemplate.findUnique({
      where: { id: projectRequest.templateId },
      include,
    });

    if (exactTemplate) return exactTemplate;
  }

  return prisma.projectTemplate.findFirst({
    where: {
      packageType: projectRequest.packageType as any,
      isActive: true,
    },
    include,
  });
}

/**
 * POST /api/project-requests/[id]/approve
 *
 * Approves a project request and creates:
 * - project
 * - copied phases/deliverables from the selected template
 * - deposit and balance payments
 *
 * New requests use projectRequest.templateId exactly.
 * Old requests fall back to packageType matching.
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;

  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const body = await request.json();
  const {
    totalAmount,
    depositAmount,
    balanceAmount,
    projectManagerId,
    targetDate,
    internalNotes,
  } = body;

  if (totalAmount == null || depositAmount == null || balanceAmount == null) {
    return errorResponse("Payment amounts are required", 400);
  }

  if (Number(totalAmount) <= 0) {
    return errorResponse("Total amount must be greater than zero", 400);
  }

  if (Number(depositAmount) < 0 || Number(balanceAmount) < 0) {
    return errorResponse("Payment amounts cannot be negative", 400);
  }

  const projectRequest = await prisma.projectRequest.findUnique({
    where: { id },
    include: {
      client: true,
    },
  });

  if (!projectRequest) return errorResponse("Request not found", 404);

  if (projectRequest.status !== "PENDING_REVIEW") {
    return errorResponse("Request has already been processed", 400);
  }

  const existingProject = await prisma.project.findUnique({
    where: { requestId: id },
  });

  if (existingProject) {
    return errorResponse("Request has already been processed", 400);
  }

  if (projectManagerId) {
    const manager = await prisma.user.findUnique({
      where: { id: projectManagerId },
      select: { role: true },
    });

    if (!manager || !["PROJECT_MANAGER", "SUPER_ADMIN"].includes(manager.role)) {
      return errorResponse("Invalid project manager", 400);
    }
  }

  const template = await loadTemplateForRequest(projectRequest);

  if (!template) {
    return errorResponse("No active template found for this request", 400);
  }

  const code = makeProjectCode();
  const paymentBank = resolvePaymentBankDetails();

  const project = await prisma.$transaction(async (tx) => {
    await tx.projectRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        templateId: projectRequest.templateId ?? template.id,
        packageType: template.packageType,
      },
    });

    const proj = await tx.project.create({
      data: {
        clientId: projectRequest.clientId,
        templateId: template.id,
        title: projectRequest.projectName,
        businessName: projectRequest.businessName,
        clientEmail: projectRequest.client.email,
        packageType: template.packageType,
        status: "APPROVED_AWAITING_DEPOSIT",
        targetDate: targetDate ? new Date(targetDate) : null,
        projectCode: code,
        projectManagerId: projectManagerId || null,
        totalAmount: Number(totalAmount),
        depositAmount: Number(depositAmount),
        balanceAmount: Number(balanceAmount),
        internalNotes: internalNotes ?? projectRequest.additionalNotes ?? null,
        clientBrief: projectRequest.projectDescription,
        requestId: projectRequest.id,
      },
    });

    for (let i = 0; i < template.phases.length; i++) {
      const tPhase = template.phases[i];

      await tx.projectPhase.create({
        data: {
          projectId: proj.id,
          phaseNumber: i + 1,
          title: tPhase.title,
          description: tPhase.description ?? "",
          status: i === 0 ? "NOT_STARTED" : "LOCKED",
          deliverables: {
            create: tPhase.deliverables.map((deliverable) => ({
              name: deliverable.name,
              status: "DRAFT",
              visibleToClient: false,
            })),
          },
        },
      });
    }

    await tx.projectPayment.createMany({
      data: [
        {
          projectId: proj.id,
          type: "DEPOSIT",
          amount: Number(depositAmount),
          status: "UNPAID",
          reference: makePaymentRef(code, "DEP"),
          bankName: paymentBank.bankName,
          accountName: paymentBank.accountName,
          accountNumber: paymentBank.accountNumber,
        },
        {
          projectId: proj.id,
          type: "BALANCE",
          amount: Number(balanceAmount),
          status: "UNPAID",
          reference: makePaymentRef(code, "BAL"),
          bankName: paymentBank.bankName,
          accountName: paymentBank.accountName,
          accountNumber: paymentBank.accountNumber,
        },
      ],
    });

    await tx.notification.create({
      data: {
        userId: projectRequest.clientId,
        title: "Project approved",
        body: `Your project "${projectRequest.projectName}" has been approved. Please complete the deposit payment to unlock project tracking.`,
        href: `/client/projects/${proj.id}`,
      },
    });

    return proj;
  });

  const full = await prisma.project.findUnique({
    where: { id: project.id },
    include: projectIncludes,
  });

  return NextResponse.json(full, { status: 201 });
}
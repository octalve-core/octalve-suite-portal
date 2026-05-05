import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse, makeProjectCode, makePaymentRef } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/project-requests/[id]/approve
 * Atomically: approve request → create project + phases + deliverables + payments.
 * Role: SUPER_ADMIN only.
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;
  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const body = await request.json();
  const { totalAmount, depositAmount, balanceAmount, projectManagerId, targetDate, internalNotes } = body;

  // Validate amounts
  if (totalAmount == null || depositAmount == null || balanceAmount == null) {
    return errorResponse("Payment amounts are required", 400);
  }

  const projectRequest = await prisma.projectRequest.findUnique({
    where: { id },
    include: { client: true },
  });

  if (!projectRequest) return errorResponse("Request not found", 404);
  if (projectRequest.status !== "PENDING_REVIEW") {
    return errorResponse("Request has already been processed", 400);
  }

  // Find template matching the request's package type
  const template = await prisma.projectTemplate.findFirst({
    where: { packageType: projectRequest.packageType, isActive: true },
    include: {
      phases: {
        orderBy: { order: "asc" },
        include: { deliverables: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!template) return errorResponse("No template found for this package type", 400);

  const code = makeProjectCode();
  const bankName = process.env.OCTALVE_BANK_NAME ?? "Octalve Bank";
  const accountName = process.env.OCTALVE_ACCOUNT_NAME ?? "Octalve";
  const accountNumber = process.env.OCTALVE_ACCOUNT_NUMBER ?? "0000000000";

  // Atomic transaction: update request + create project + phases + deliverables + payments
  const project = await prisma.$transaction(async (tx) => {
    // 1. Mark request as approved
    await tx.projectRequest.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    // 2. Create project
    const proj = await tx.project.create({
      data: {
        requestId: id,
        clientId: projectRequest.clientId,
        title: projectRequest.projectName,
        businessName: projectRequest.businessName,
        clientEmail: projectRequest.client.email,
        packageType: projectRequest.packageType,
        status: "APPROVED_AWAITING_DEPOSIT",
        targetDate: targetDate ? new Date(targetDate) : null,
        projectCode: code,
        projectManagerId: projectManagerId ?? null,
        totalAmount,
        depositAmount,
        balanceAmount,
        internalNotes: internalNotes ?? null,
        clientBrief: `${projectRequest.projectGoal}\n${projectRequest.projectDescription}`,
      },
    });

    // 3. Create phases with deliverables
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
            create: tPhase.deliverables.map((d, dIdx) => ({
              name: d.name,
              status: "DRAFT",
              visibleToClient: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
          },
        },
      });
    }

    // 4. Create payments
    await tx.projectPayment.createMany({
      data: [
        {
          projectId: proj.id,
          type: "DEPOSIT",
          amount: depositAmount,
          status: "UNPAID",
          reference: makePaymentRef(code, "DEP"),
          bankName,
          accountName,
          accountNumber,
        },
        {
          projectId: proj.id,
          type: "BALANCE",
          amount: balanceAmount,
          status: "UNPAID",
          reference: makePaymentRef(code, "BAL"),
          bankName,
          accountName,
          accountNumber,
        },
      ],
    });

    // 5. Notify client
    await tx.notification.create({
      data: {
        userId: projectRequest.clientId,
        title: "Project approved",
        body: `${proj.title} has been approved. Deposit payment is required.`,
        href: "/client/payments",
      },
    });

    return proj;
  });

  // Return full project with includes
  const full = await prisma.project.findUnique({
    where: { id: project.id },
    include: {
      phases: {
        orderBy: { phaseNumber: "asc" },
        include: {
          deliverables: { orderBy: { createdAt: "asc" } },
          messages: { orderBy: { createdAt: "asc" } },
        },
      },
      payments: true,
    },
  });

  return NextResponse.json(full, { status: 201 });
}

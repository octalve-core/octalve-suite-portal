import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/projects/[id] — Single project detail with all nested data.
 */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const project = await prisma.project.findUnique({
    where: { id },
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

  if (!project) return errorResponse("Project not found", 404);

  const { user, role } = result;
  const isAdmin = role === "SUPER_ADMIN";
  const isClientOwner = role === "CLIENT" && project.clientId === user.id;
  const isAssignedStaff =
    role === "STAFF" && project.phases.some((phase) => phase.assignedStaffId === user.id);
  const isAssignedProjectManager =
    role === "PROJECT_MANAGER" &&
    (project.projectManagerId === user.id ||
      project.phases.some((phase) => phase.assignedStaffId === user.id));

  if (!isAdmin && !isClientOwner && !isAssignedStaff && !isAssignedProjectManager) {
    return errorResponse("Forbidden", 403);
  }

  return NextResponse.json(project);
}

/**
 * DELETE /api/projects/[id] — Delete a project.
 * Role: SUPER_ADMIN only.
 */
/**
 * PATCH /api/projects/[id] — Update project settings.
 * Role: SUPER_ADMIN or assigned PROJECT_MANAGER.
 */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN", "PROJECT_MANAGER");
  if (forbidden) return forbidden;

  const existing = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      projectManagerId: true,
    },
  });

  if (!existing) return errorResponse("Project not found", 404);

  const isAdmin = result.role === "SUPER_ADMIN";
  const isAssignedManager =
    result.role === "PROJECT_MANAGER" && existing.projectManagerId === result.user.id;

  if (!isAdmin && !isAssignedManager) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();

  const data: {
    title?: string;
    targetDate?: Date | null;
    internalNotes?: string | null;
    projectManagerId?: string | null;
  } = {};

  if (typeof body.title === "string") {
    const title = body.title.trim();

    if (!title) {
      return errorResponse("Project title cannot be empty", 400);
    }

    data.title = title;
  }

  if (typeof body.targetDate === "string") {
    const rawDate = body.targetDate.trim();

    if (!rawDate) {
      data.targetDate = null;
    } else {
      const parsed = new Date(rawDate.includes("T") ? rawDate : `${rawDate}T00:00:00.000`);

      if (Number.isNaN(parsed.getTime())) {
        return errorResponse("Invalid target date", 400);
      }

      data.targetDate = parsed;
    }
  }

  if (typeof body.internalNotes === "string") {
    data.internalNotes = body.internalNotes.trim() || null;
  }

  if (isAdmin && typeof body.projectManagerId === "string") {
    const managerId = body.projectManagerId.trim();

    if (!managerId) {
      data.projectManagerId = null;
    } else {
      const manager = await prisma.user.findUnique({
        where: { id: managerId },
        select: { id: true, role: true },
      });

      if (!manager || !["PROJECT_MANAGER", "SUPER_ADMIN"].includes(manager.role)) {
        return errorResponse("Invalid project manager", 400);
      }

      data.projectManagerId = managerId;
    }
  }

  if (!Object.keys(data).length) {
    return errorResponse("No valid project settings supplied", 400);
  }

  const updated = await prisma.project.update({
    where: { id },
    data,
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

  return NextResponse.json(updated);
}
export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const existing = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      projectCode: true,
      clientEmail: true,
      _count: {
        select: {
          phases: true,
          payments: true,
          paymentTransactions: true,
          reviews: true,
          walletLedgerEntries: true,
        },
      },
    },
  });

  if (!existing) return errorResponse("Project not found", 404);

  const body = await request.json().catch(() => ({}));
  const confirmCode = String(body.confirmCode ?? "").trim();

  if (confirmCode !== existing.projectCode) {
    return errorResponse("Project delete confirmation code did not match", 400);
  }

  const deleted = await prisma.$transaction(async (tx) => {
    await tx.project.delete({ where: { id: existing.id } });

    return {
      id: existing.id,
      title: existing.title,
      projectCode: existing.projectCode,
      clientEmail: existing.clientEmail,
      phaseCount: existing._count.phases,
      paymentCount: existing._count.payments,
      transactionCount: existing._count.paymentTransactions,
      reviewCount: existing._count.reviews,
      walletLedgerEntryCount: existing._count.walletLedgerEntries,
    };
  });

  return NextResponse.json({
    success: true,
    deleted,
  });
}

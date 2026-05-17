import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function canManageDeliverable(deliverableId: string) {
  const auth = await getSessionOrThrow();

  if (auth.error) {
    return { error: auth.error as NextResponse };
  }

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    include: {
      phase: {
        include: {
          project: true,
        },
      },
    },
  });

  if (!deliverable) {
    return {
      error: NextResponse.json(
        { error: "Deliverable not found" },
        { status: 404 },
      ),
    };
  }

  if (auth.role === "CLIENT") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  const isAdmin = auth.role === "SUPER_ADMIN";
  const isProjectManager =
    auth.role === "PROJECT_MANAGER" &&
    deliverable.phase.project.projectManagerId === auth.user.id;
  const isAssignedStaff =
    auth.role === "STAFF" && deliverable.phase.assignedStaffId === auth.user.id;

  if (!isAdmin && !isProjectManager && !isAssignedStaff) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  if (
    deliverable.phase.status === "APPROVED" ||
    deliverable.status === "APPROVED"
  ) {
    return {
      error: NextResponse.json(
        { error: "Approved deliverables cannot be changed." },
        { status: 409 },
      ),
    };
  }

  return { deliverable };
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await canManageDeliverable(id);

  if ("error" in access) return access.error;

  const body = await request.json();

  const updated = await prisma.deliverable.update({
    where: { id },
    data: {
      name: typeof body.name === "string" ? body.name.trim() : undefined,
      description:
        typeof body.description === "string" ? body.description.trim() : undefined,
      link: typeof body.link === "string" ? body.link.trim() : undefined,
      linkType: typeof body.linkType === "string" ? body.linkType : undefined,
      visibleToClient:
        typeof body.visibleToClient === "boolean"
          ? body.visibleToClient
          : undefined,
      status: body.status,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await canManageDeliverable(id);

  if ("error" in access) return access.error;

  await prisma.deliverable.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

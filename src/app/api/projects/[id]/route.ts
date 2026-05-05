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

  // Access check: client can only view own projects, staff only assigned
  const { user, role } = result;
  if (role === "CLIENT" && project.clientId !== user.id) {
    return errorResponse("Forbidden", 403);
  }

  return NextResponse.json(project);
}

/**
 * DELETE /api/projects/[id] — Delete a project.
 * Role: SUPER_ADMIN only.
 */
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;
  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return errorResponse("Project not found", 404);

  await prisma.project.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

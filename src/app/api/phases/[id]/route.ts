import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, errorResponse } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/phases/[id] — Phase detail with deliverables and messages.
 */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const phase = await prisma.projectPhase.findUnique({
    where: { id },
    include: {
      deliverables: { orderBy: { createdAt: "asc" } },
      messages: { orderBy: { createdAt: "asc" } },
      project: { select: { clientId: true, projectManagerId: true } },
    },
  });

  if (!phase) return errorResponse("Phase not found", 404);

  // Access check for clients
  if (result.role === "CLIENT" && phase.project.clientId !== result.user.id) {
    return errorResponse("Forbidden", 403);
  }

  return NextResponse.json(phase);
}

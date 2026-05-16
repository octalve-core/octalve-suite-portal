import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, errorResponse } from "@/lib/api-helpers";

type Params = { params: Promise<{ phaseId: string }> };

/**
 * Check if the user has access to a phase's messages.
 */
async function checkAccess(phaseId: string, userId: string, role: string) {
  const phase = await prisma.projectPhase.findUnique({
    where: { id: phaseId },
    include: { project: { select: { clientId: true, projectManagerId: true } } },
  });
  if (!phase) return { phase: null, allowed: false };

  if (role === "SUPER_ADMIN" || role === "PROJECT_MANAGER") return { phase, allowed: true };
  if (role === "CLIENT" && phase.project.clientId === userId) return { phase, allowed: true };
  if (role === "STAFF" && phase.assignedStaffId === userId) return { phase, allowed: true };

  return { phase, allowed: false };
}

/**
 * GET /api/messages/[phaseId] — List messages for a phase.
 */
export async function GET(_request: Request, { params }: Params) {
  const { phaseId } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const { allowed } = await checkAccess(phaseId, result.user.id, result.role);
  if (!allowed) return errorResponse("Forbidden", 403);

  const messages = await prisma.phaseMessage.findMany({
    where: { phaseId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

/**
 * POST /api/messages/[phaseId] — Send a message in a phase thread.
 */
export async function POST(request: Request, { params }: Params) {
  const { phaseId } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const { phase, allowed } = await checkAccess(phaseId, result.user.id, result.role);
  if (!allowed || !phase) return errorResponse("Forbidden", 403);

  const body = await request.json();
  const { message } = body;
  if (!message?.trim()) return errorResponse("Message is required", 400);

  const msg = await prisma.phaseMessage.create({
    data: {
      phaseId,
      senderId: result.user.id,
      senderName: result.user.name ?? "User",
      senderRole: result.role,
      message: message.trim(),
      type: "MESSAGE",
    },
  });

  return NextResponse.json(msg, { status: 201 });
}

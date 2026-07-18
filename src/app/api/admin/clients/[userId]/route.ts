import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";

type Params = { params: Promise<{ userId: string }> };

function cleanReason(value: unknown) {
  return String(value ?? "").trim().slice(0, 500);
}

function cleanConfirm(value: unknown) {
  return String(value ?? "").trim();
}

type ClientPromotionRole = "STAFF" | "PROJECT_MANAGER";

function cleanPromotionRole(value: unknown): ClientPromotionRole | null {
  const role = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (role === "STAFF") return "STAFF";

  if (role === "PROJECT_MANAGER" || role === "PROJECTMANAGER" || role === "PM" || role === "PROJECT_LEAD") {
    return "PROJECT_MANAGER";
  }

  return null;
}

async function getClientOrError(userId: string) {
  const client = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
      banReason: true,
      banExpires: true,
      _count: {
        select: {
          clientProjects: true,
          projectRequests: true,
          reviews: true,
          walletTopUps: true,
          walletLedgerEntries: true,
        },
      },
    },
  });

  if (!client) {
    return { error: errorResponse("Client not found", 404), client: null };
  }

  if (client.role !== "CLIENT") {
    return { error: errorResponse("Only client accounts can be managed here", 400), client: null };
  }

  return { error: null, client };
}

/**
 * PATCH /api/admin/clients/[userId]
 * SUPER_ADMIN only.
 *
 * Supported actions:
 * - FLAG_THREAT: bans/flags a client with an admin reason.
 * - CLEAR_THREAT: removes the threat flag/ban marker.
 * - UPDATE_CLIENT_ROLE: promotes a client to Staff or Project Manager.
 */
export async function PATCH(request: Request, { params }: Params) {
  const { userId } = await params;

  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const { error, client } = await getClientOrError(userId);
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const action = cleanConfirm(body.action).toUpperCase();

  if (action === "FLAG_THREAT") {
    const reason = cleanReason(body.reason);

    if (reason.length < 10) {
      return errorResponse("A clear threat reason is required", 400);
    }

    const updated = await prisma.user.update({
      where: { id: client.id },
      data: {
        banned: true,
        banReason: `Threat flag: ${reason}`,
        banExpires: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        banReason: true,
        banExpires: true,
      },
    });

    return NextResponse.json({
      success: true,
      action: "FLAG_THREAT",
      client: updated,
    });
  }

  if (action === "CLEAR_THREAT") {
    const updated = await prisma.user.update({
      where: { id: client.id },
      data: {
        banned: false,
        banReason: null,
        banExpires: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        banReason: true,
        banExpires: true,
      },
    });

    return NextResponse.json({
      success: true,
      action: "CLEAR_THREAT",
      client: updated,
    });
  }

  if (action === "UPDATE_CLIENT_ROLE") {
    const targetRole = cleanPromotionRole(body.role);
    const confirmText = cleanConfirm(body.confirmText);

    if (!targetRole) {
      return errorResponse("Invalid client role upgrade target", 400);
    }

    if (confirmText !== "PROMOTE CLIENT") {
      return errorResponse("Client role upgrade confirmation text did not match", 400);
    }

    if (client.banned) {
      return errorResponse("Clear threat flag before upgrading client role", 400);
    }

    const updated = await prisma.user.update({
      where: { id: client.id },
      data: {
        role: targetRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialty: true,
        banned: true,
        banReason: true,
        banExpires: true,
      },
    });

    return NextResponse.json({
      success: true,
      action: "UPDATE_CLIENT_ROLE",
      user: updated,
    });
  }
  return errorResponse("Unsupported client action", 400);
}

/**
 * DELETE /api/admin/clients/[userId]
 * SUPER_ADMIN only.
 *
 * Hard-deletes a client account from the server.
 * Requires exact email confirmation and DELETE CLIENT confirmation text.
 */
export async function DELETE(request: Request, { params }: Params) {
  const { userId } = await params;

  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  if (userId === result.user.id) {
    return errorResponse("Cannot delete yourself", 400);
  }

  const { error, client } = await getClientOrError(userId);
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const confirmEmail = cleanConfirm(body.confirmEmail).toLowerCase();
  const confirmText = cleanConfirm(body.confirmText);

  if (confirmEmail !== client.email.toLowerCase()) {
    return errorResponse("Client delete email confirmation did not match", 400);
  }

  if (confirmText !== "DELETE CLIENT") {
    return errorResponse("Client delete confirmation text did not match", 400);
  }

  const deleted = await prisma.$transaction(async (tx) => {
    await tx.user.delete({
      where: { id: client.id },
    });

    return {
      id: client.id,
      email: client.email,
      projectCount: client._count.clientProjects,
      requestCount: client._count.projectRequests,
      reviewCount: client._count.reviews,
      walletTopUpCount: client._count.walletTopUps,
      walletLedgerEntryCount: client._count.walletLedgerEntries,
    };
  });

  return NextResponse.json({
    success: true,
    deleted,
  });
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/api-helpers";

/**
 * POST /api/notifications/mark-all-read
 * Marks all notifications visible to the current user as read.
 */
export async function POST() {
  const result = await getSessionOrThrow();

  if (result.error) {
    return result.error;
  }

  const updated = await prisma.notification.updateMany({
    where: {
      read: false,
      OR: [
        { userId: result.user.id },
        { role: result.role, userId: null },
      ],
    },
    data: {
      read: true,
    },
  });

  return NextResponse.json({
    success: true,
    count: updated.count,
  });
}
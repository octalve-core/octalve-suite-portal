import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/api-helpers";

/**
 * GET /api/notifications — List notifications for the current user.
 * Returns notifications targeted to the user's ID or their role.
 */
export async function GET() {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const notifications = await prisma.notification.findMany({
    where: {
      OR: [
        { userId: result.user.id },
        { role: result.role, userId: null },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifications);
}

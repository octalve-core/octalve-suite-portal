import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await getSessionOrThrow();

  if (result.error) {
    return result.error;
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const read = Boolean(body.read);

  const notification = await prisma.notification.findFirst({
    where: {
      id,
      OR: [
        { userId: result.user.id },
        { role: result.role, userId: null },
      ],
    },
    select: {
      id: true,
    },
  });

  if (!notification) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 },
    );
  }

  await prisma.notification.update({
    where: { id },
    data: { read },
  });

  return NextResponse.json({ success: true });
}
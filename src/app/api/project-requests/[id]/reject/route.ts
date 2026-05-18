import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const role = ((session?.user as any)?.role ?? "CLIENT") as string;

  if (!session || role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.projectRequest.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Project request not found" },
      { status: 404 },
    );
  }

  if (
    existing.status !== "PENDING_REVIEW" &&
    existing.status !== "INFO_REQUESTED"
  ) {
    return NextResponse.json(
      {
        error:
          "Only pending or information-requested requests can be rejected.",
      },
      { status: 400 },
    );
  }

  const request = await prisma.projectRequest.update({
    where: { id },
    data: { status: "REJECTED" },
  });

  return NextResponse.json(request);
}
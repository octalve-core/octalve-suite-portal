import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles } from "@/lib/api-helpers";

/**
 * GET /api/clients — List all client users with project counts.
 * Role: SUPER_ADMIN.
 */
export async function GET() {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;
  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      phone: true,
      createdAt: true,
      _count: {
        select: { clientProjects: true },
      },
      clientProjects: {
        select: {
          id: true,
          status: true,
          packageType: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(clients);
}

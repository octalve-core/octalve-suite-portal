import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";

/**
 * GET /api/project-requests — List all project requests.
 * Role: SUPER_ADMIN, PROJECT_MANAGER.
 */
export async function GET() {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;
  const forbidden = requireRoles(result.role, "SUPER_ADMIN", "PROJECT_MANAGER");
  if (forbidden) return forbidden;

  const requests = await prisma.projectRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: { select: { id: true, name: true, email: true, company: true } } },
  });

  return NextResponse.json(requests);
}

/**
 * POST /api/project-requests — Submit a new project request.
 * Role: CLIENT.
 */
export async function POST(request: Request) {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;
  const forbidden = requireRoles(result.role, "CLIENT");
  if (forbidden) return forbidden;

  const body = await request.json();
  const {
    packageType,
    projectName,
    businessName,
    phone,
    projectGoal,
    projectDescription,
    preferredTimeline,
    additionalNotes,
  } = body;

  if (!projectName?.trim()) return errorResponse("Project name is required", 400);
  if (!businessName?.trim()) return errorResponse("Business name is required", 400);
  if (!projectGoal?.trim()) return errorResponse("Project goal is required", 400);

  const created = await prisma.projectRequest.create({
    data: {
      clientId: result.user.id,
      packageType: packageType ?? "Launch",
      projectName: projectName.trim(),
      businessName: businessName.trim(),
      phone: phone ?? null,
      projectGoal: projectGoal.trim(),
      projectDescription: projectDescription ?? "",
      preferredTimeline: preferredTimeline ?? null,
      additionalNotes: additionalNotes ?? null,
    },
  });

  // Notify admins
  await prisma.notification.create({
    data: {
      role: "SUPER_ADMIN",
      title: "New project request",
      body: `${created.projectName} is waiting for review.`,
      href: "/admin/project-requests",
    },
  });

  return NextResponse.json(created, { status: 201 });
}

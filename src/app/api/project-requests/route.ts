import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";

/**
 * GET /api/project-requests — List project requests.
 *
 * SUPER_ADMIN and PROJECT_MANAGER can see all requests.
 * CLIENT can see only their own submitted requests.
 */
export async function GET() {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const { user, role } = result;

  if (!["SUPER_ADMIN", "PROJECT_MANAGER", "CLIENT"].includes(role)) {
    return errorResponse("Forbidden", 403);
  }

  const requests = await prisma.projectRequest.findMany({
    where: role === "CLIENT" ? { clientId: user.id } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          packageType: true,
          category: true,
          color: true,
          iconKey: true,
          sortOrder: true,
          isOfficial: true,
          isActive: true,
          description: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
        },
      },
    },
  });

  return NextResponse.json(requests);
}

/**
 * POST /api/project-requests — Submit a new project request.
 * Role: CLIENT.
 *
 * Production rule:
 * - Client must submit a real active database templateId.
 * - packageType is derived from that template, not trusted from frontend.
 */
export async function POST(request: Request) {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "CLIENT");
  if (forbidden) return forbidden;

  const body = await request.json();
  const {
    templateId,
    projectName,
    businessName,
    phone,
    projectGoal,
    projectDescription,
    preferredTimeline,
    additionalNotes,
  } = body;

  if (!templateId?.trim()) return errorResponse("Select an active project template", 400);
  if (!projectName?.trim()) return errorResponse("Project name is required", 400);
  if (!businessName?.trim()) return errorResponse("Business name is required", 400);
  if (!projectGoal?.trim()) return errorResponse("Project goal is required", 400);

  const template = await prisma.projectTemplate.findFirst({
    where: {
      id: templateId.trim(),
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      packageType: true,
    },
  });

  if (!template) {
    return errorResponse("Selected template is no longer available. Please choose another template.", 400);
  }

  const created = await prisma.projectRequest.create({
    data: {
      clientId: result.user.id,
      templateId: template.id,
      packageType: template.packageType,
      projectName: projectName.trim(),
      businessName: businessName.trim(),
      phone: phone?.trim() || null,
      projectGoal: projectGoal.trim(),
      projectDescription: projectDescription?.trim() || "",
      preferredTimeline: preferredTimeline?.trim() || null,
      additionalNotes: additionalNotes?.trim() || null,
      status: "PENDING_REVIEW",
    },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          packageType: true,
          category: true,
          color: true,
          iconKey: true,
          sortOrder: true,
          isOfficial: true,
          isActive: true,
          description: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
        },
      },
    },
  });

  await prisma.notification.create({
    data: {
      role: "SUPER_ADMIN",
      title: "New project request",
      body: `${created.businessName} submitted a new ${template.name} project request.`,
      href: `/admin/project-requests/${created.id}`,
    },
  });

  await prisma.notification.create({
    data: {
      userId: result.user.id,
      title: "Project request received",
      body: "Your project request has been received and is now under admin review. Octalve will update you once it is approved.",
      href: "/client/projects",
    },
  });

  return NextResponse.json(created, { status: 201 });
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";
import type { PackageType } from "@/lib/types";

/**
 * GET /api/templates — List all active templates with phases flattened for the frontend.
 */
export async function GET() {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const templates = await prisma.projectTemplate.findMany({
    where: { isActive: true },
    include: {
      phases: {
        orderBy: { order: "asc" },
        include: { deliverables: { orderBy: { order: "asc" } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Flatten TemplateDeliverable[] into string[] for the frontend
  const mapped = templates.map((t) => ({
    id: t.id,
    name: t.name,
    packageType: t.packageType as PackageType,
    description: t.description,
    phases: t.phases.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description ?? "",
      deliverables: p.deliverables.map((d) => d.name),
    })),
  }));

  return NextResponse.json(mapped);
}

/**
 * POST /api/templates — Create a new template with phases and deliverables.
 * Role: SUPER_ADMIN only.
 */
export async function POST(request: Request) {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;
  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const body = await request.json();
  const { name, packageType, description, phases } = body;

  if (!name?.trim()) return errorResponse("Template name is required", 400);

  const template = await prisma.projectTemplate.create({
    data: {
      name: name.trim(),
      packageType: packageType ?? "Launch",
      description: description ?? "",
      phases: {
        create: (phases ?? []).map(
          (phase: { title: string; description?: string; deliverables?: string[] }, index: number) => ({
            order: index + 1,
            title: phase.title,
            description: phase.description ?? "",
            deliverables: {
              create: (phase.deliverables ?? []).map((delName: string, dIdx: number) => ({
                name: delName,
                order: dIdx + 1,
              })),
            },
          }),
        ),
      },
    },
    include: {
      phases: {
        orderBy: { order: "asc" },
        include: { deliverables: { orderBy: { order: "asc" } } },
      },
    },
  });

  return NextResponse.json(
    {
      id: template.id,
      name: template.name,
      packageType: template.packageType,
      description: template.description,
      phases: template.phases.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description ?? "",
        deliverables: p.deliverables.map((d) => d.name),
      })),
    },
    { status: 201 },
  );
}

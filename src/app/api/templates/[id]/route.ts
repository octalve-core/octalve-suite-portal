import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/templates/[id] — Update a template. Replaces phases entirely.
 * Role: SUPER_ADMIN only.
 */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;
  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const body = await request.json();
  const { name, packageType, description, phases } = body;

  const existing = await prisma.projectTemplate.findUnique({ where: { id } });
  if (!existing) return errorResponse("Template not found", 404);

  // If phases are provided, delete old phases and recreate
  if (phases) {
    await prisma.templatePhase.deleteMany({ where: { templateId: id } });
  }

  const template = await prisma.projectTemplate.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(packageType !== undefined && { packageType }),
      ...(description !== undefined && { description }),
      ...(phases && {
        phases: {
          create: phases.map(
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
      }),
    },
    include: {
      phases: {
        orderBy: { order: "asc" },
        include: { deliverables: { orderBy: { order: "asc" } } },
      },
    },
  });

  return NextResponse.json({
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
  });
}

/**
 * DELETE /api/templates/[id] — Soft-delete a template (mark inactive).
 * Role: SUPER_ADMIN only.
 */
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;
  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const existing = await prisma.projectTemplate.findUnique({ where: { id } });
  if (!existing) return errorResponse("Template not found", 404);

  await prisma.projectTemplate.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}

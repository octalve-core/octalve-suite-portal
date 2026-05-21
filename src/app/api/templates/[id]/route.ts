import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";
import type { PackageType } from "@/lib/types";
import { getPackageCatalogItem } from "@/components/portal/packageCatalog";

type Params = { params: Promise<{ id: string }> };

function serializeTemplate(template: any) {
  const catalog = getPackageCatalogItem(template.packageType);

  return {
    id: template.id,
    name: template.name,
    packageType: template.packageType as PackageType,
    slug: template.slug ?? null,
    category: template.category || catalog.category || "Custom",
    color: template.color || catalog.color || "#5300D9",
    iconKey: template.iconKey || template.packageType || "layers",
    sortOrder: template.sortOrder ?? 999,
    isOfficial: template.isOfficial ?? false,
    isActive: template.isActive ?? true,
    description: template.description,
    phases: (template.phases ?? []).map((phase: any) => ({
      id: phase.id,
      title: phase.title,
      description: phase.description ?? "",
      deliverables: (phase.deliverables ?? []).map((deliverable: any) => deliverable.name),
    })),
  };
}

async function updateTemplateRecord(request: Request, id: string) {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const body = await request.json();
  const {
    name,
    packageType,
    slug,
    category,
    color,
    iconKey,
    sortOrder,
    isOfficial,
    isActive,
    description,
    phases,
  } = body;

  if (!name?.trim()) return errorResponse("Template name is required", 400);

  const exists = await prisma.projectTemplate.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!exists) return errorResponse("Template not found", 404);

  const catalog = getPackageCatalogItem(packageType ?? "Custom");

  const updated = await prisma.$transaction(async (tx) => {
    await tx.templatePhase.deleteMany({
      where: { templateId: id },
    });

    await tx.projectTemplate.update({
      where: { id },
      data: {
        name: name.trim(),
        packageType: packageType ?? "Custom",
        slug: slug?.trim() || null,
        category: category?.trim() || catalog.category || "Custom",
        color: color?.trim() || catalog.color || "#5300D9",
        iconKey: iconKey?.trim() || packageType || "layers",
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 999,
        isOfficial: Boolean(isOfficial),
        isActive: isActive === false ? false : true,
        description: description?.trim() ?? "",
      },
    });

    for (const [index, phase] of (phases ?? []).entries()) {
      await tx.templatePhase.create({
        data: {
          templateId: id,
          order: index + 1,
          title: phase.title?.trim() || `Phase ${index + 1}`,
          description: phase.description?.trim() ?? "",
          deliverables: {
            create: (phase.deliverables ?? [])
              .map((deliverable: string) => deliverable.trim())
              .filter(Boolean)
              .map((deliverable: string, deliverableIndex: number) => ({
                name: deliverable,
                order: deliverableIndex + 1,
              })),
          },
        },
      });
    }

    return tx.projectTemplate.findUniqueOrThrow({
      where: { id },
      include: {
        phases: {
          orderBy: { order: "asc" },
          include: { deliverables: { orderBy: { order: "asc" } } },
        },
      },
    });
  });

  return NextResponse.json(serializeTemplate(updated));
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  return updateTemplateRecord(request, id);
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  return updateTemplateRecord(request, id);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;

  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const exists = await prisma.projectTemplate.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!exists) return errorResponse("Template not found", 404);

  await prisma.projectTemplate.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
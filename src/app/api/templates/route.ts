import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";
import type { PackageType } from "@/lib/types";
import { getPackageCatalogItem } from "@/components/portal/packageCatalog";

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

/**
 * GET /api/templates — List active database-managed templates only.
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
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
  });

  return NextResponse.json(templates.map(serializeTemplate));
}

/**
 * POST /api/templates — Create a database-managed template.
 * Role: SUPER_ADMIN only.
 */
export async function POST(request: Request) {
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

  const catalog = getPackageCatalogItem(packageType ?? "Custom");

  const template = await prisma.projectTemplate.create({
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
      phases: {
        create: (phases ?? []).map(
          (
            phase: { title: string; description?: string; deliverables?: string[] },
            index: number,
          ) => ({
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

  return NextResponse.json(serializeTemplate(template), { status: 201 });
}
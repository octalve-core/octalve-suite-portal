import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";

/**
 * GET /api/reviews — List all reviews.
 * Role: SUPER_ADMIN.
 */
export async function GET() {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;
  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true, email: true, company: true } },
      project: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(reviews);
}

/**
 * POST /api/reviews — Submit a review for a completed project.
 * Role: CLIENT.
 */
export async function POST(request: Request) {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;
  const forbidden = requireRoles(result.role, "CLIENT");
  if (forbidden) return forbidden;

  const body = await request.json();
  const { projectId, rating, comment, permissionToPublish } = body;

  if (!projectId) return errorResponse("projectId is required", 400);
  if (!rating || rating < 1 || rating > 5) return errorResponse("Rating must be 1-5", 400);
  if (!comment?.trim()) return errorResponse("Comment is required", 400);

  // Verify project belongs to client and is completed
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return errorResponse("Project not found", 404);
  if (project.clientId !== result.user.id) return errorResponse("Forbidden", 403);
  if (project.status !== "COMPLETED") return errorResponse("Can only review completed projects", 400);

  // Check for existing review (unique constraint will also catch this)
  const existing = await prisma.review.findUnique({
    where: { projectId_clientId: { projectId, clientId: result.user.id } },
  });
  if (existing) return errorResponse("Review already submitted for this project", 400);

  const review = await prisma.review.create({
    data: {
      projectId,
      clientId: result.user.id,
      rating,
      comment: comment.trim(),
      permissionToPublish: permissionToPublish ?? false,
    },
  });

  return NextResponse.json(review, { status: 201 });
}

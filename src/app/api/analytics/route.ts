import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles } from "@/lib/api-helpers";

/**
 * GET /api/analytics — Admin dashboard aggregate metrics.
 * Role: SUPER_ADMIN.
 */
export async function GET() {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;
  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const [
    totalProjects,
    activeProjects,
    completedProjects,
    overduePhases,
    launchCount,
    impactCount,
    growthCount,
    partnerCount,
    notStarted,
    inProgress,
    awaitingApproval,
    approvedPhases,
    changesRequested,
    totalRevenue,
    confirmedRevenue,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.project.count({ where: { status: "COMPLETED" } }),
    prisma.projectPhase.count({ where: { status: "CHANGES_REQUESTED" } }),
    prisma.project.count({ where: { packageType: "Launch" } }),
    prisma.project.count({ where: { packageType: "Impact" } }),
    prisma.project.count({ where: { packageType: "Growth" } }),
    prisma.project.count({ where: { packageType: "Partner" } }),
    prisma.projectPhase.count({ where: { status: "NOT_STARTED" } }),
    prisma.projectPhase.count({ where: { status: "IN_PROGRESS" } }),
    prisma.projectPhase.count({ where: { status: "AWAITING_APPROVAL" } }),
    prisma.projectPhase.count({ where: { status: "APPROVED" } }),
    prisma.projectPhase.count({ where: { status: "CHANGES_REQUESTED" } }),
    prisma.project.aggregate({ _sum: { totalAmount: true } }),
    prisma.projectPayment.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { amount: true },
    }),
  ]);

  return NextResponse.json({
    totalProjects,
    activeProjects,
    completedProjects,
    overduePhases,
    packageBreakdown: [
      { name: "Launch", value: launchCount },
      { name: "Impact", value: impactCount },
      { name: "Growth", value: growthCount },
      { name: "Partner", value: partnerCount },
    ],
    phaseBreakdown: [
      { status: "Not Started", count: notStarted },
      { status: "In Progress", count: inProgress },
      { status: "Awaiting Approval", count: awaitingApproval },
      { status: "Approved", count: approvedPhases },
      { status: "Changes Requested", count: changesRequested },
    ],
    totalRevenue: totalRevenue._sum.totalAmount ?? 0,
    confirmedRevenue: confirmedRevenue._sum.amount ?? 0,
  });
}

import { prisma } from "@/lib/prisma";
import { errorResponse, getSessionOrThrow } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_STATEMENT_ROWS = 1000;

function csvCell(value: unknown) {
  const text = String(value ?? "")
    .replace(/\r?\n|\r/g, " ")
    .trim();

  return `"${text.replace(/"/g, '""')}"`;
}

function formatDate(value: Date) {
  return value.toISOString();
}

function formatAmount(value: number) {
  return Number.isFinite(value) ? String(value) : "0";
}

function noStoreCsv(csv: string) {
  const today = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="octalve-wallet-statement-${today}.csv"`,
      "Cache-Control": "no-store, max-age=0, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export async function GET() {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  if (result.role !== "CLIENT") {
    return errorResponse("Forbidden", 403);
  }

  const userId = result.user.id;

  const entries = await prisma.walletLedgerEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: MAX_STATEMENT_ROWS,
    include: {
      project: {
        select: {
          projectCode: true,
          title: true,
          businessName: true,
        },
      },
      payment: {
        select: {
          reference: true,
          type: true,
          status: true,
          amount: true,
        },
      },
      topUp: {
        select: {
          reference: true,
          provider: true,
          status: true,
          amount: true,
        },
      },
    },
  });

  const headers = [
    "Date",
    "Type",
    "Direction",
    "Description",
    "Reference",
    "Amount",
    "Currency",
    "Balance After",
    "Project Code",
    "Project Title",
    "Payment Reference",
    "Payment Type",
    "Top Up Reference",
    "Top Up Provider",
  ];

  const rows = entries.map((entry) => [
    formatDate(entry.createdAt),
    entry.entryType,
    entry.direction,
    entry.description ?? "",
    entry.reference,
    formatAmount(entry.amount),
    entry.currency,
    entry.balanceAfter ?? "",
    entry.project?.projectCode ?? "",
    entry.project?.title ?? "",
    entry.payment?.reference ?? "",
    entry.payment?.type ?? "",
    entry.topUp?.reference ?? "",
    entry.topUp?.provider ?? "",
  ]);

  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\n");

  return noStoreCsv(csv);
}
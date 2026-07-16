import type { ProjectRequest } from "@/lib/types";
import { getPackageTitle } from "../../packageCatalog";
import { ClientRequestStatusChip } from "./ClientProjectStatusChip";
import { packageBadgeStyle } from "./client-projects-utils";

export function ClientPendingRequestsPanel({
  requests,
}: {
  requests: ProjectRequest[];
}) {
  if (!requests.length) return null;

  return (
    <section className="rounded-[28px] border border-blue-100 bg-blue-50/60 p-5 shadow-[0_12px_28px_rgba(0,100,224,0.06)]">
      <div>
        <span className="inline-flex rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-bold text-[#0064E0]">
          Under Admin Review
        </span>
        <h2 className="mt-3 text-xl font-medium tracking-[-0.035em] text-slate-900">
          Submitted Project Request{requests.length === 1 ? "" : "s"}
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          These requests have been received by Octalve. Once approved, a full project workspace will open here.
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        {requests.map((request) => (
          <article
            key={request.id}
            className="rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_8px_18px_rgba(15,23,42,0.03)]"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <strong className="block truncate text-sm text-slate-950">
                  {request.projectName || request.businessName || "Project request"}
                </strong>
                <span className="mt-1 block truncate text-sm text-slate-500">
                  {request.businessName || "Business name not provided"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <span
                  className="inline-flex rounded-full border px-3 py-1 text-xs font-extrabold"
                  style={packageBadgeStyle(request.packageType)}
                >
                  {getPackageTitle(request.packageType)}
                </span>
                <ClientRequestStatusChip status={request.status} />
              </div>
            </div>

            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
              {request.projectGoal || request.projectDescription || "Your brief is waiting for admin review."}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

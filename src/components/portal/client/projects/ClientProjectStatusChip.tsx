import type { PackageType, ProjectStatus, ProjectRequest } from "@/lib/types";
import {
  PROJECT_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
  projectStatusTone,
  requestStatusTone,
} from "./client-projects-utils";

export function ClientProjectStatusChip({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
        projectStatusTone(status),
      ].join(" ")}
    >
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}

export function ClientRequestStatusChip({
  status,
}: {
  status: ProjectRequest["status"];
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
        requestStatusTone(status),
      ].join(" ")}
    >
      {REQUEST_STATUS_LABELS[status]}
    </span>
  );
}

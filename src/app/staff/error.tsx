"use client";

import { WorkspaceErrorBoundary } from "@/components/portal/WorkspaceErrorBoundary";

export default function StaffError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return <WorkspaceErrorBoundary role="staff" reset={reset} />;
}
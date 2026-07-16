"use client";

import { WorkspaceErrorBoundary } from "@/components/portal/WorkspaceErrorBoundary";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return <WorkspaceErrorBoundary role="admin" reset={reset} />;
}
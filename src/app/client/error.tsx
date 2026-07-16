"use client";

import { WorkspaceErrorBoundary } from "@/components/portal/WorkspaceErrorBoundary";

export default function ClientError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return <WorkspaceErrorBoundary role="client" reset={reset} />;
}
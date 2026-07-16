"use client";

import { WorkspaceErrorBoundary } from "@/components/portal/WorkspaceErrorBoundary";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return <WorkspaceErrorBoundary role="general" reset={reset} />;
}
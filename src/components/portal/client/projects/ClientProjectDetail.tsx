"use client";

import { ClientProjectDetailView } from "./detail/ClientProjectDetailView";

export function ClientProjectDetail({ projectId }: { projectId: string }) {
  return <ClientProjectDetailView projectId={projectId} />;
}

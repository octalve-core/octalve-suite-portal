"use client";

import { ProjectWorkspaceDetail } from "../../ProjectWorkspace";

export function ClientProjectDetail({ projectId }: { projectId: string }) {
  return <ProjectWorkspaceDetail role="client" projectId={projectId} />;
}

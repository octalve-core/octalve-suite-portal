"use client";

import { PhaseWorkspaceDetail } from "../../ProjectWorkspace";

export function ClientPhaseDetail({ phaseId }: { phaseId: string }) {
  return <PhaseWorkspaceDetail role="client" phaseId={phaseId} />;
}

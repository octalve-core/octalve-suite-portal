"use client";

import { ClientPhaseDetailView } from "./detail/ClientPhaseDetailView";

export function ClientPhaseDetail({ phaseId }: { phaseId: string }) {
  return <ClientPhaseDetailView phaseId={phaseId} />;
}

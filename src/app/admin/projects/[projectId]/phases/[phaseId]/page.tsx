import { PortalShell } from "@/components/portal/PortalShell";
import { AdminPhaseDetail } from "@/components/portal/AdminScreens";
export default async function Page({ params }: { params: Promise<{ projectId: string; phaseId: string }> }) {
  const { projectId, phaseId } = await params;
  return <PortalShell role="SUPER_ADMIN"><AdminPhaseDetail projectId={projectId} phaseId={phaseId} /></PortalShell>;
}

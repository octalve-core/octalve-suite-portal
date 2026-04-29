import { PortalShell } from "@/components/portal/PortalShell";
import { ClientPhaseDetail } from "@/components/portal/ClientScreens";
export default async function Page({ params }: { params: Promise<{ phaseId: string }> }) { const { phaseId } = await params; return <PortalShell role="CLIENT"><ClientPhaseDetail phaseId={phaseId} /></PortalShell>; }

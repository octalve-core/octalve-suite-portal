import { PortalShell } from "@/components/portal/PortalShell";
import { AdminProjectDetail } from "@/components/portal/AdminScreens";
export default async function Page({ params }: { params: Promise<{ projectId: string }> }) { const { projectId } = await params; return <PortalShell role="SUPER_ADMIN"><AdminProjectDetail projectId={projectId} /></PortalShell>; }

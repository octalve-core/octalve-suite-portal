import { PortalShell } from "@/components/portal/PortalShell";
import { AdminProjectPhaseDetail } from "@/components/portal/AdminScreens";

export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string; phaseId: string }>;
}) {
  const { projectId, phaseId } = await params;

  return (
    <PortalShell role="SUPER_ADMIN">
      <AdminProjectPhaseDetail projectId={projectId} phaseId={phaseId} />
    </PortalShell>
  );
}

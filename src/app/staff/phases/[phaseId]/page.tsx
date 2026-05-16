import { PortalShell } from "@/components/portal/PortalShell";
import { StaffPhaseDetail } from "@/components/portal/StaffScreens";
export default async function Page({
  params,
}: {
  params: Promise<{ phaseId: string }>;
}) {
  const { phaseId } = await params;
  return (
    <PortalShell role="STAFF">
      <StaffPhaseDetail phaseId={phaseId} />
    </PortalShell>
  );
}

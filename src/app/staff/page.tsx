import { PortalShell } from "@/components/portal/PortalShell";
import { StaffDashboard } from "@/components/portal/StaffScreens";
export default function Page() {
  return (
    <PortalShell role="STAFF">
      <StaffDashboard />
    </PortalShell>
  );
}

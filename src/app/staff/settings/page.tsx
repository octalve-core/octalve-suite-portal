import { PortalShell } from "@/components/portal/PortalShell";
import { StaffSettings } from "@/components/portal/StaffScreens";
export default function Page() {
  return (
    <PortalShell role="STAFF">
      <StaffSettings />
    </PortalShell>
  );
}

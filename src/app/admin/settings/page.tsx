import { AdminSettingsHub } from "@/components/portal/AdminSettingsHub";
import { PortalShell } from "@/components/portal/PortalShell";

export default function Page() {
  return (
    <PortalShell role="SUPER_ADMIN">
      <AdminSettingsHub />
    </PortalShell>
  );
}
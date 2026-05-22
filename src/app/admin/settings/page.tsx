import { AdminSystemSettings } from "@/components/portal/AdminSystemSettings";
import { PortalShell } from "@/components/portal/PortalShell";

export default function Page() {
  return (
    <PortalShell role="SUPER_ADMIN">
      <AdminSystemSettings />
    </PortalShell>
  );
}
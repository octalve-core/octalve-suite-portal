import { PortalShell } from "@/components/portal/PortalShell";
import { AdminUsersDirectory } from "@/components/portal/AdminUsersWorkspace";

export default function Page() {
  return (
    <PortalShell role="SUPER_ADMIN">
      <AdminUsersDirectory mode="clients" />
    </PortalShell>
  );
}
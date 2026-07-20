import { AdminAuditWorkspace } from "@/components/portal/AdminAuditWorkspace";
import { PortalShell } from "@/components/portal/PortalShell";

export default function Page() {
  return (
    <PortalShell role="SUPER_ADMIN">
      <AdminAuditWorkspace />
    </PortalShell>
  );
}

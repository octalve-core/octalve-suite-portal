import { PortalShell } from "@/components/portal/PortalShell";
import { AdminProjectRequestsManager } from "@/components/portal/AdminProjectRequestsManager";

export default function Page() {
  return (
    <PortalShell role="SUPER_ADMIN">
      <AdminProjectRequestsManager />
    </PortalShell>
  );
}

import { PortalShell } from "@/components/portal/PortalShell";
import { AdminPaymentsManager } from "@/components/portal/AdminPaymentsManager";

export default function Page() {
  return (
    <PortalShell role="SUPER_ADMIN">
      <AdminPaymentsManager />
    </PortalShell>
  );
}

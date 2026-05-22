import { PortalShell } from "@/components/portal/PortalShell";
import { AdminWalletManager } from "@/components/portal/AdminWalletManager";

export default function Page() {
  return (
    <PortalShell role="SUPER_ADMIN">
      <AdminWalletManager />
    </PortalShell>
  );
}
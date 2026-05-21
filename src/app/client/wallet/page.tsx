import { PortalShell } from "@/components/portal/PortalShell";
import { ClientWalletManager } from "@/components/portal/ClientWalletManager";

export default function Page() {
  return (
    <PortalShell role="CLIENT">
      <ClientWalletManager />
    </PortalShell>
  );
}
import { PortalShell } from "@/components/portal/PortalShell";
import { ClientPaymentsManager } from "@/components/portal/ClientPaymentsManager";

export default function Page() {
  return (
    <PortalShell role="CLIENT">
      <ClientPaymentsManager />
    </PortalShell>
  );
}

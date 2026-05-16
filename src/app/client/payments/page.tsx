import { PortalShell } from "@/components/portal/PortalShell";
import { ClientPayments } from "@/components/portal/ClientScreens";

export default function Page() {
  return (
    <PortalShell role="CLIENT">
      <ClientPayments />
    </PortalShell>
  );
}

import { PortalShell } from "@/components/portal/PortalShell";
import { ClientDashboard } from "@/components/portal/ClientScreens";

export default function Page() {
  return (
    <PortalShell role="CLIENT">
      <ClientDashboard />
    </PortalShell>
  );
}

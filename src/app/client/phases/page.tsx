import { PortalShell } from "@/components/portal/PortalShell";
import { ClientPhases } from "@/components/portal/ClientScreens";

export default function Page() {
  return (
    <PortalShell role="CLIENT">
      <ClientPhases />
    </PortalShell>
  );
}

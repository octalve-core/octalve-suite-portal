import { PortalShell } from "@/components/portal/PortalShell";
import { ClientSupport } from "@/components/portal/client/support/ClientSupport";

export default function Page() {
  return (
    <PortalShell role="CLIENT">
      <ClientSupport />
    </PortalShell>
  );
}

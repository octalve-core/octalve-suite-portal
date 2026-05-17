import { PortalShell } from "@/components/portal/PortalShell";
import { SupportScreen } from "@/components/portal/SupportScreen";

export default function Page() {
  return (
    <PortalShell role="CLIENT">
      <SupportScreen />
    </PortalShell>
  );
}

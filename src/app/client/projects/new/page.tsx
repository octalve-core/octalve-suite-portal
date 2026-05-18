import { PortalShell } from "@/components/portal/PortalShell";
import { ClientCreateProjectExpanded } from "@/components/portal/ClientCreateProjectExpanded";

export default function Page() {
  return (
    <PortalShell role="CLIENT">
      <ClientCreateProjectExpanded />
    </PortalShell>
  );
}
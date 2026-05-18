import { PortalShell } from "@/components/portal/PortalShell";
import { AdminTemplatesManager } from "@/components/portal/AdminTemplatesManager";

export default function Page() {
  return (
    <PortalShell role="SUPER_ADMIN">
      <AdminTemplatesManager />
    </PortalShell>
  );
}

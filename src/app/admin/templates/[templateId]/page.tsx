import { PortalShell } from "@/components/portal/PortalShell";
import { AdminTemplateEditPage } from "@/components/portal/AdminTemplateEditPage";

export default function Page() {
  return (
    <PortalShell role="SUPER_ADMIN">
      <AdminTemplateEditPage />
    </PortalShell>
  );
}
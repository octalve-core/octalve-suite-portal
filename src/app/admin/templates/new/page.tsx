import { PortalShell } from "@/components/portal/PortalShell";
import { AdminTemplateNewPage } from "@/components/portal/AdminTemplateNewPage";

export default function Page() {
  return (
    <PortalShell role="SUPER_ADMIN">
      <AdminTemplateNewPage />
    </PortalShell>
  );
}
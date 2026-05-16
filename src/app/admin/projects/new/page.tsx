import { PortalShell } from "@/components/portal/PortalShell";
import { AdminCreateProject } from "@/components/portal/AdminScreens";
export default function Page() {
  return (
    <PortalShell role="SUPER_ADMIN">
      <AdminCreateProject />
    </PortalShell>
  );
}

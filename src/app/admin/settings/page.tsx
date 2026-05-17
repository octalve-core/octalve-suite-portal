import { PortalShell } from "@/components/portal/PortalShell";
import { ProfileSettings } from "@/components/portal/ProfileSettings";

export default function Page() {
  return (
    <PortalShell role="SUPER_ADMIN">
      <ProfileSettings
        title="Settings"
        subtitle="Manage your admin profile and workspace preferences"
      />
    </PortalShell>
  );
}

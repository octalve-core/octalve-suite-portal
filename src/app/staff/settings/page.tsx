import { PortalShell } from "@/components/portal/PortalShell";
import { ProfileSettings } from "@/components/portal/ProfileSettings";

export default function Page() {
  return (
    <PortalShell role="STAFF">
      <ProfileSettings
        title="Settings"
        subtitle="Manage your staff profile and workspace preferences"
      />
    </PortalShell>
  );
}

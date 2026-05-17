import { PortalShell } from "@/components/portal/PortalShell";
import { ProfileSettings } from "@/components/portal/ProfileSettings";

export default function Page() {
  return (
    <PortalShell role="CLIENT">
      <ProfileSettings
        title="Settings"
        subtitle="Manage your client profile and workspace preferences"
      />
    </PortalShell>
  );
}

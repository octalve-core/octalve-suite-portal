import { PortalShell } from "@/components/portal/PortalShell";
import { ProfileSettings } from "@/components/portal/ProfileSettings";

export default function Page() {
  return (
    <PortalShell role="CLIENT">
      <ProfileSettings
        title="Client Settings"
        subtitle="Manage your profile, security, notifications, and workspace preferences."
      />
    </PortalShell>
  );
}
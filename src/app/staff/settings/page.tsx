import { PortalShell } from "@/components/portal/PortalShell";
import { ProfileSettings } from "@/components/portal/ProfileSettings";

export default function Page() {
  return (
    <PortalShell role="STAFF">
      <ProfileSettings
        title="Staff Settings"
        subtitle="Manage your staff profile, delivery identity, and account security"
      />
    </PortalShell>
  );
}

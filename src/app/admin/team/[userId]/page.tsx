import { PortalShell } from "@/components/portal/PortalShell";
import { AdminUserDetailPage } from "@/components/portal/AdminUsersWorkspace";

export default async function Page({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return (
    <PortalShell role="SUPER_ADMIN">
      <AdminUserDetailPage userId={userId} mode="team" />
    </PortalShell>
  );
}
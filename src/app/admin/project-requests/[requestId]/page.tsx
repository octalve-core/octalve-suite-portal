import { PortalShell } from "@/components/portal/PortalShell";
import { AdminProjectRequestDetailPage } from "@/components/portal/AdminProjectRequestDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;

  return (
    <PortalShell role="SUPER_ADMIN">
      <AdminProjectRequestDetailPage requestId={requestId} />
    </PortalShell>
  );
}
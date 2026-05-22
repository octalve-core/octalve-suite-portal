import { PortalShell } from "@/components/portal/PortalShell";
import { AdminWalletTopUpDetailPage } from "@/components/portal/AdminWalletTopUpDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ topUpId: string }>;
}) {
  const { topUpId } = await params;

  return (
    <PortalShell role="SUPER_ADMIN">
      <AdminWalletTopUpDetailPage topUpId={topUpId} />
    </PortalShell>
  );
}
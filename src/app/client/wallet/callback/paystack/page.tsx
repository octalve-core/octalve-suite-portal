import { PortalShell } from "@/components/portal/PortalShell";
import { PaystackWalletTopUpCallbackPage } from "@/components/portal/WalletTopUpCallbackPages";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    reference?: string;
    trxref?: string;
    topUpId?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <PortalShell role="CLIENT">
      <PaystackWalletTopUpCallbackPage
        reference={params.reference ?? params.trxref}
        topUpId={params.topUpId}
      />
    </PortalShell>
  );
}
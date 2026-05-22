import { PortalShell } from "@/components/portal/PortalShell";
import { FlutterwaveWalletTopUpCallbackPage } from "@/components/portal/WalletTopUpCallbackPages";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    tx_ref?: string;
    transaction_id?: string;
    topUpId?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <PortalShell role="CLIENT">
      <FlutterwaveWalletTopUpCallbackPage
        providerStatus={params.status}
        txRef={params.tx_ref}
        transactionId={params.transaction_id}
        topUpId={params.topUpId}
      />
    </PortalShell>
  );
}
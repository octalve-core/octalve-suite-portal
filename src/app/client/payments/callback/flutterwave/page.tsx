import { PortalShell } from "@/components/portal/PortalShell";
import { FlutterwavePaymentCallbackPage } from "@/components/portal/PaymentCallbackPages";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    tx_ref?: string;
    transaction_id?: string;
    paymentId?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <PortalShell role="CLIENT">
      <FlutterwavePaymentCallbackPage
        status={params.status}
        txRef={params.tx_ref}
        transactionId={params.transaction_id}
        paymentId={params.paymentId}
      />
    </PortalShell>
  );
}
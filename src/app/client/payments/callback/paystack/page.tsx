import { PortalShell } from "@/components/portal/PortalShell";
import { PaystackPaymentCallbackPage } from "@/components/portal/PaymentCallbackPages";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    reference?: string;
    trxref?: string;
    paymentId?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <PortalShell role="CLIENT">
      <PaystackPaymentCallbackPage
        reference={params.reference ?? params.trxref}
        paymentId={params.paymentId}
      />
    </PortalShell>
  );
}
import { PortalShell } from "@/components/portal/PortalShell";
import { ClientPaymentsView } from "@/components/portal/client/payments/ClientPaymentsView";

export default async function Page({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;

  return (
    <PortalShell role="CLIENT">
      <ClientPaymentsView initialPaymentId={paymentId} />
    </PortalShell>
  );
}
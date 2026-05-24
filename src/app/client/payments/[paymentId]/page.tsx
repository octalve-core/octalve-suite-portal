import { PortalShell } from "@/components/portal/PortalShell";
import { ClientPaymentDetailView } from "@/components/portal/client/payments/detail/ClientPaymentDetailView";

export default async function Page({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;

  return (
    <PortalShell role="CLIENT">
      <ClientPaymentDetailView paymentId={paymentId} />
    </PortalShell>
  );
}
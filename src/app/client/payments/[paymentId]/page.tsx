import { PortalShell } from "@/components/portal/PortalShell";
import { ClientPaymentDetailPage } from "@/components/portal/PaymentDetailPages";

export default async function Page({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;

  return (
    <PortalShell role="CLIENT">
      <ClientPaymentDetailPage paymentId={paymentId} />
    </PortalShell>
  );
}
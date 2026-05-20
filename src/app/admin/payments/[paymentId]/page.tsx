import { PortalShell } from "@/components/portal/PortalShell";
import { AdminPaymentDetailPage } from "@/components/portal/PaymentDetailPages";

export default async function Page({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;

  return (
    <PortalShell role="SUPER_ADMIN">
      <AdminPaymentDetailPage paymentId={paymentId} />
    </PortalShell>
  );
}
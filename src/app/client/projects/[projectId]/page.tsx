import { PortalShell } from "@/components/portal/PortalShell";
import { ClientProjectDetail } from "@/components/portal/ClientScreens";

export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <PortalShell role="CLIENT">
      <ClientProjectDetail projectId={projectId} />
    </PortalShell>
  );
}

import { requireRole } from "@/lib/auth-server";
import type React from "react";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("CLIENT");
  return <>{children}</>;
}

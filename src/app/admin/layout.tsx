import { requireRole } from "@/lib/auth-server";
import type React from "react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("SUPER_ADMIN");
  return <>{children}</>;
}

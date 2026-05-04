import { requireRole } from "@/lib/auth-server";
import type React from "react";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  await requireRole("STAFF", "PROJECT_MANAGER");
  return <>{children}</>;
}

import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/types";

const ROLE_PATHS: Record<Role, string> = {
  CLIENT: "/client",
  STAFF: "/staff",
  PROJECT_MANAGER: "/staff",
  SUPER_ADMIN: "/admin",
};

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (((session.user as any).role as string) ?? "CLIENT") as Role;
  redirect(ROLE_PATHS[role] || "/client");
}

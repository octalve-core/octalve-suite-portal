import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/api-helpers";

export async function GET() {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const { user, role } = result;

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    phone: user.phone ?? null,
    company: user.company ?? null,
    specialty: user.specialty ?? null,
    image: user.image ?? null,
  });
}

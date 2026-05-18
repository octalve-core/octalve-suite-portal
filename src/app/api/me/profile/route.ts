import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";

export async function PATCH(request: Request) {
  const auth = await getSessionOrThrow();

  if (auth.error) return auth.error;

  const body = await request.json();

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const company = typeof body.company === "string" ? body.company.trim() : "";
  const specialty =
    typeof body.specialty === "string" ? body.specialty.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: auth.user.id },
    data: {
      name,
      phone: phone || null,
      company: company || null,
      specialty: specialty || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      company: true,
      role: true,
      specialty: true,
    },
  });

  return NextResponse.json(user);
}

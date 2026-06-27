import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateProfileSchema } from "@/lib/validations/profile";

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const { name, username, phone, bio } = parsed.data;

  if (username) {
    const existing = await db.user.findUnique({ where: { username } });
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: "Ese username ya está en uso" }, { status: 409 });
    }
  }

  const user = await db.user.update({
    where: { id: session.user.id },
    data: {
      name,
      username: username || null,
      phone: phone || null,
      bio: bio || null,
    },
  });

  await db.userActivityLog.create({
    data: { userId: user.id, action: "PROFILE_UPDATED" },
  });

  return NextResponse.json({ success: true });
}

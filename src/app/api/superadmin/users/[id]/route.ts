import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import { updateUserSchema, userStatusSchema } from "@/lib/validations/user";
import { notifyUser } from "@/lib/notifications";

// Nunca devolver password/tokens en la respuesta de la API.
const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  username: true,
  role: true,
  isActive: true,
  isVerified: true,
  phone: true,
  bio: true,
  internalNote: true,
} as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("SUPERADMIN");
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => null);

  const user = await db.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  // Toggle rápido (isActive/isVerified) desde la lista.
  if (body && !("name" in body)) {
    const parsed = userStatusSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

    if (id === session.user.id && parsed.data.isActive === false) {
      return NextResponse.json({ error: "No puedes suspender tu propia cuenta desde aquí" }, { status: 400 });
    }

    const updated = await db.user.update({ where: { id }, data: parsed.data, select: SAFE_USER_SELECT });

    if (parsed.data.isActive !== undefined) {
      await db.userActivityLog.create({
        data: {
          userId: session.user.id,
          action: parsed.data.isActive ? "USER_REACTIVATED" : "USER_SUSPENDED",
          entityType: "User",
          entityId: id,
        },
      });
    }

    return NextResponse.json({ success: true, user: updated });
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const { username, phone, bio, internalNote, role, ...rest } = parsed.data;

  if (id === session.user.id && role !== user.role) {
    return NextResponse.json({ error: "No puedes cambiar tu propio rol" }, { status: 400 });
  }

  if (username) {
    const taken = await db.user.findUnique({ where: { username } });
    if (taken && taken.id !== id) return NextResponse.json({ error: "Ese username ya está en uso" }, { status: 409 });
  }

  const updated = await db.user.update({
    where: { id },
    data: {
      ...rest,
      username: username || null,
      phone: phone || null,
      bio: bio || null,
      internalNote: internalNote || null,
      role,
    },
    select: SAFE_USER_SELECT,
  });

  await db.userActivityLog.create({
    data: { userId: session.user.id, action: "USER_UPDATED", entityType: "User", entityId: id },
  });

  if (role !== user.role) {
    await db.userActivityLog.create({
      data: {
        userId: session.user.id,
        action: "USER_ROLE_CHANGED",
        entityType: "User",
        entityId: id,
        metadata: { from: user.role, to: role },
      },
    });
    await notifyUser({
      userId: id,
      type: "ROLE_CHANGED",
      title: "Tu rol fue actualizado",
      message: `Tu rol en Golazo Mundial ahora es ${role}.`,
    });
  }

  return NextResponse.json({ success: true, user: updated });
}

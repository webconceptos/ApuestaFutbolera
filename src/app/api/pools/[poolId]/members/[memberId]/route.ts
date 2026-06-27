import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePoolRole } from "@/lib/require-pool-role";
import { paymentUpdateSchema, memberRoleSchema } from "@/lib/validations/pool-member";
import { notifyUser } from "@/lib/notifications";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ poolId: string; memberId: string }> }
) {
  const { poolId, memberId } = await params;
  const ctx = await requirePoolRole(poolId, ["OWNER", "MODERATOR"]);
  if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const member = await db.poolMember.findUnique({ where: { id: memberId } });
  if (!member || member.poolId !== poolId) return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });

  const body = await request.json().catch(() => null);

  // Cambio de rol: solo OWNER.
  if (body && "role" in body) {
    if (ctx.member.role !== "OWNER") {
      return NextResponse.json({ error: "Solo el OWNER puede cambiar roles" }, { status: 403 });
    }
    const parsed = memberRoleSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    if (member.userId === ctx.session.user.id) {
      return NextResponse.json({ error: "No puedes cambiar tu propio rol" }, { status: 400 });
    }

    const updated = await db.poolMember.update({ where: { id: memberId }, data: { role: parsed.data.role } });
    await db.userActivityLog.create({
      data: {
        userId: ctx.session.user.id,
        action: "MEMBER_ROLE_CHANGED",
        entityType: "Pool",
        entityId: poolId,
        metadata: { memberId, from: member.role, to: parsed.data.role },
      },
    });
    return NextResponse.json({ success: true, member: updated });
  }

  // Confirmar/desmarcar pago.
  const parsed = paymentUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const updated = await db.poolMember.update({
    where: { id: memberId },
    data: { hasPaid: parsed.data.hasPaid, paymentNote: parsed.data.paymentNote || null },
  });

  if (parsed.data.hasPaid && !member.hasPaid) {
    await db.userActivityLog.create({
      data: { userId: ctx.session.user.id, action: "PAYMENT_CONFIRMED", entityType: "Pool", entityId: poolId },
    });
    await notifyUser({
      userId: member.userId,
      poolId,
      type: "PAYMENT_CONFIRMED",
      title: "Pago confirmado",
      message: "Tu pago fue confirmado. ¡Ya puedes apostar!",
    });
  }

  return NextResponse.json({ success: true, member: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ poolId: string; memberId: string }> }
) {
  const { poolId, memberId } = await params;
  const ctx = await requirePoolRole(poolId, ["OWNER", "MODERATOR"]);
  if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const member = await db.poolMember.findUnique({ where: { id: memberId } });
  if (!member || member.poolId !== poolId) return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  if (member.role === "OWNER") return NextResponse.json({ error: "No se puede expulsar al OWNER" }, { status: 400 });

  // Soft: se conservan sus predicciones, pero deja de contar en el ranking.
  await db.poolMember.update({ where: { id: memberId }, data: { isActive: false } });

  await db.userActivityLog.create({
    data: { userId: ctx.session.user.id, action: "MEMBER_REMOVED", entityType: "Pool", entityId: poolId },
  });

  await db.notification.create({
    data: {
      userId: member.userId,
      poolId,
      type: "CUSTOM",
      title: "Fuiste removido de una polla",
      message: "Un administrador te quitó de una polla en la que participabas.",
    },
  });

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePoolRole } from "@/lib/require-pool-role";
import { sendPoolInviteEmail } from "@/lib/email";
import { addMemberSchema } from "@/lib/validations/pool-member";

export async function POST(request: NextRequest, { params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params;
  const ctx = await requirePoolRole(poolId, ["OWNER", "MODERATOR"]);
  if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = addMemberSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Email inválido" }, { status: 400 });

  const pool = await db.pool.findUnique({ where: { id: poolId } });
  if (!pool) return NextResponse.json({ error: "Polla no encontrada" }, { status: 404 });

  const targetUser = await db.user.findUnique({ where: { email: parsed.data.email } });

  if (!targetUser) {
    await sendPoolInviteEmail({
      to: parsed.data.email,
      poolName: pool.name,
      inviterName: ctx.session.user.name ?? "Un organizador de Golazo Mundial",
      inviteCode: pool.inviteCode,
    });
    return NextResponse.json({ success: true, invited: true, message: "Invitación enviada por email." });
  }

  const existing = await db.poolMember.findUnique({
    where: { poolId_userId: { poolId, userId: targetUser.id } },
  });
  if (existing) {
    if (existing.isActive) return NextResponse.json({ error: "Ese usuario ya es miembro de la polla" }, { status: 409 });
    await db.poolMember.update({ where: { id: existing.id }, data: { isActive: true } });
    return NextResponse.json({ success: true });
  }

  await db.poolMember.create({
    data: { poolId, userId: targetUser.id, role: "PLAYER", invitedBy: ctx.session.user.id },
  });

  await db.userActivityLog.create({
    data: { userId: ctx.session.user.id, action: "MEMBER_ADDED", entityType: "Pool", entityId: poolId },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

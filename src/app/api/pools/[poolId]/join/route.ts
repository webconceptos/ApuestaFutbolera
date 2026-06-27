import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest, { params }: { params: Promise<{ poolId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { poolId } = await params;
  const body = await request.json().catch(() => ({}));
  const inviteCode = typeof body?.inviteCode === "string" ? body.inviteCode : undefined;

  const pool = await db.pool.findUnique({ where: { id: poolId }, include: { config: true } });
  if (!pool || !pool.isActive) return NextResponse.json({ error: "Polla no encontrada" }, { status: 404 });

  if (pool.inviteOnly && inviteCode !== pool.inviteCode) {
    return NextResponse.json({ error: "Código de invitación inválido" }, { status: 403 });
  }

  if (pool.config && !pool.config.registrationOpen) {
    return NextResponse.json({ error: "Las inscripciones de esta polla están cerradas" }, { status: 400 });
  }

  const existing = await db.poolMember.findUnique({
    where: { poolId_userId: { poolId, userId: session.user.id } },
  });
  if (existing) {
    if (existing.isActive) {
      return NextResponse.json({ success: true, alreadyMember: true, pool: { slug: pool.slug } });
    }
    // Reingreso de alguien que había salido/sido expulsado.
    await db.poolMember.update({ where: { id: existing.id }, data: { isActive: true } });
    return NextResponse.json({ success: true, pool: { slug: pool.slug } });
  }

  if (pool.config) {
    const memberCount = await db.poolMember.count({ where: { poolId, isActive: true } });
    if (memberCount >= pool.config.maxMembers) {
      return NextResponse.json({ error: "Esta polla ya alcanzó el máximo de participantes" }, { status: 400 });
    }
  }

  await db.poolMember.create({
    data: { poolId, userId: session.user.id, role: "PLAYER", invitedBy: pool.ownerId },
  });

  await db.userActivityLog.create({
    data: { userId: session.user.id, action: "POOL_JOINED", entityType: "Pool", entityId: poolId },
  });

  return NextResponse.json({ success: true, pool: { slug: pool.slug } }, { status: 201 });
}

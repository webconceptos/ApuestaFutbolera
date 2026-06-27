import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePoolRole } from "@/lib/require-pool-role";
import { transferOwnershipSchema } from "@/lib/validations/pool";

// Solo se puede transferir a un MODERATOR activo: se intercambian roles
// (el OWNER actual pasa a MODERATOR). Ver CLAUDE.md, sección de roles.
export async function POST(request: NextRequest, { params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params;
  const ctx = await requirePoolRole(poolId, ["OWNER"]);
  if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const parsed = transferOwnershipSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const target = await db.poolMember.findUnique({ where: { id: parsed.data.newOwnerId } });
  if (!target || target.poolId !== poolId || !target.isActive || target.role !== "MODERATOR") {
    return NextResponse.json({ error: "Solo puedes transferir la propiedad a un moderador activo" }, { status: 400 });
  }

  await db.$transaction([
    db.poolMember.update({ where: { id: ctx.member.id }, data: { role: "MODERATOR" } }),
    db.poolMember.update({ where: { id: target.id }, data: { role: "OWNER" } }),
    db.pool.update({ where: { id: poolId }, data: { ownerId: target.userId } }),
  ]);
  await db.userActivityLog.create({
    data: {
      userId: ctx.session.user.id,
      action: "POOL_UPDATED",
      entityType: "Pool",
      entityId: poolId,
      metadata: { section: "ownership", newOwnerUserId: target.userId },
    },
  });

  return NextResponse.json({ success: true });
}

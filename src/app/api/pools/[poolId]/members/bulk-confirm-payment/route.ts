import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePoolRole } from "@/lib/require-pool-role";
import { notifyUser } from "@/lib/notifications";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params;
  const ctx = await requirePoolRole(poolId, ["OWNER", "MODERATOR"]);
  if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const pending = await db.poolMember.findMany({
    where: { poolId, hasPaid: false, isActive: true },
    select: { id: true, userId: true },
  });

  if (pending.length === 0) {
    return NextResponse.json({ success: true, confirmed: 0 });
  }

  await db.poolMember.updateMany({
    where: { id: { in: pending.map((p) => p.id) } },
    data: { hasPaid: true },
  });

  // Uno por uno (no createMany) para respetar notifPrefs de cada usuario.
  for (const p of pending) {
    await notifyUser({
      userId: p.userId,
      poolId,
      type: "PAYMENT_CONFIRMED",
      title: "Pago confirmado",
      message: "Tu pago fue confirmado. ¡Ya puedes apostar!",
    });
  }

  await db.userActivityLog.create({
    data: {
      userId: ctx.session.user.id,
      action: "PAYMENT_CONFIRMED",
      entityType: "Pool",
      entityId: poolId,
      metadata: { bulk: true, count: pending.length },
    },
  });

  return NextResponse.json({ success: true, confirmed: pending.length });
}

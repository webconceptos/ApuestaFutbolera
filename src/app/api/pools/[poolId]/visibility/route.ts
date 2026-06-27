import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePoolRole } from "@/lib/require-pool-role";
import { updatePoolVisibilitySchema } from "@/lib/validations/pool";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params;
  const ctx = await requirePoolRole(poolId, ["OWNER"]);
  if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const parsed = updatePoolVisibilitySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }
  const {
    inviteOnly,
    isPublic,
    registrationOpen,
    maxMembers,
    publicPanelEnabled,
    publicShowRanking,
    publicShowPredictions,
    publicShowFixture,
    showOthersPredictions,
  } = parsed.data;

  await db.pool.update({ where: { id: poolId }, data: { inviteOnly, isPublic } });
  await db.poolConfig.update({
    where: { poolId },
    data: {
      registrationOpen,
      maxMembers,
      publicPanelEnabled,
      publicShowRanking,
      publicShowPredictions,
      publicShowFixture,
      showOthersPredictions,
    },
  });
  await db.userActivityLog.create({
    data: { userId: ctx.session.user.id, action: "POOL_UPDATED", entityType: "Pool", entityId: poolId, metadata: { section: "visibility" } },
  });

  return NextResponse.json({ success: true });
}

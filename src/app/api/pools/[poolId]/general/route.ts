import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePoolRole } from "@/lib/require-pool-role";
import { updatePoolGeneralSchema } from "@/lib/validations/pool";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params;
  const ctx = await requirePoolRole(poolId, ["OWNER"]);
  if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const parsed = updatePoolGeneralSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }
  const { name, description, logo, accentColor, welcomeMessage, rules } = parsed.data;

  await db.pool.update({
    where: { id: poolId },
    data: { name, description: description || null, logo: logo || null },
  });
  await db.poolConfig.update({
    where: { poolId },
    data: { accentColor, welcomeMessage: welcomeMessage || null, rules: rules || null },
  });
  await db.userActivityLog.create({
    data: { userId: ctx.session.user.id, action: "POOL_UPDATED", entityType: "Pool", entityId: poolId, metadata: { section: "general" } },
  });

  return NextResponse.json({ success: true });
}

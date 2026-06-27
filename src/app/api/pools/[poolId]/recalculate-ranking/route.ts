import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePoolRole } from "@/lib/require-pool-role";
import { recalculatePoolRanking } from "@/lib/scoring-batch";

// Disparo manual del mismo recálculo que corre automáticamente al ingresar
// un resultado (Paso 19) — hace falta cuando se cambia scoringStartDate
// (Configuración → Puntuación): los partidos que quedan afuera del corte no
// van a tener otro evento de scoring que dispare el recálculo por sí solo.
export async function POST(request: NextRequest, { params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params;
  const ctx = await requirePoolRole(poolId, ["OWNER"]);
  if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  await recalculatePoolRanking(poolId);

  await db.userActivityLog.create({
    data: { userId: ctx.session.user.id, action: "POOL_UPDATED", entityType: "Pool", entityId: poolId, metadata: { section: "recalculate_ranking" } },
  });

  return NextResponse.json({ success: true });
}

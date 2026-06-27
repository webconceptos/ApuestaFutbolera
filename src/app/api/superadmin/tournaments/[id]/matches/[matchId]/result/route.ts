import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canManageTournament } from "@/lib/require-role";
import { matchResultSchema } from "@/lib/validations/match";
import { runScoringBatch } from "@/lib/scoring-batch";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { id: tournamentId, matchId } = await params;
  const session = await canManageTournament(tournamentId, "results");
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = matchResultSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match || match.tournamentId !== tournamentId) {
    return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  }

  const updated = await db.match.update({
    where: { id: matchId },
    data: { homeScore: parsed.data.homeScore, awayScore: parsed.data.awayScore, status: "FINISHED" },
  });

  await db.userActivityLog.create({
    data: {
      userId: session.user.id,
      action: "RESULT_ENTERED",
      entityType: "Match",
      entityId: matchId,
      metadata: { homeScore: parsed.data.homeScore, awayScore: parsed.data.awayScore },
    },
  });

  const summary = await runScoringBatch(matchId);

  return NextResponse.json({
    success: true,
    match: updated,
    summary,
    message: `Procesadas ${summary.predictionsProcessed} predicciones en ${summary.poolsAffected} pollas. ${summary.exactCount} aciertos exactos.`,
  });
}

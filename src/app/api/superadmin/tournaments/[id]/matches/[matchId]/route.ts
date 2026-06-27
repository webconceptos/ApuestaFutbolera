import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canManageTournament } from "@/lib/require-role";
import { matchSchema } from "@/lib/validations/match";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { id: tournamentId, matchId } = await params;
  const session = await canManageTournament(tournamentId, "edit");
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = matchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match || match.tournamentId !== tournamentId) {
    return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  }

  const { round, venue, city, status, ...rest } = parsed.data;

  const updated = await db.match.update({
    where: { id: matchId },
    data: {
      ...rest,
      round: round === "" || round === undefined ? null : round,
      venue: venue || null,
      city: city || null,
      status: status ?? match.status,
      matchDate: new Date(parsed.data.matchDate),
    },
  });

  await db.userActivityLog.create({
    data: { userId: session.user.id, action: "MATCH_UPDATED", entityType: "Match", entityId: matchId },
  });

  return NextResponse.json({ success: true, match: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { id: tournamentId, matchId } = await params;
  const session = await canManageTournament(tournamentId, "edit");
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match || match.tournamentId !== tournamentId) {
    return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  }

  const predictionCount = await db.prediction.count({ where: { matchId } });
  if (predictionCount > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar: ya tiene predicciones. Márcalo como cancelado en su lugar." },
      { status: 400 }
    );
  }

  await db.match.delete({ where: { id: matchId } });

  return NextResponse.json({ success: true });
}

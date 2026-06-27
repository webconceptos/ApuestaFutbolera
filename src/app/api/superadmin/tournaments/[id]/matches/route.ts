import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canManageTournament } from "@/lib/require-role";
import { matchSchema } from "@/lib/validations/match";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: tournamentId } = await params;
  const session = await canManageTournament(tournamentId, "create");
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = matchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const tournament = await db.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });

  const last = await db.match.findFirst({ where: { tournamentId }, orderBy: { matchNumber: "desc" } });
  const matchNumber = (last?.matchNumber ?? 0) + 1;

  const { round, venue, city, status, ...rest } = parsed.data;

  const match = await db.match.create({
    data: {
      ...rest,
      tournamentId,
      matchNumber,
      round: round === "" || round === undefined ? null : round,
      venue: venue || null,
      city: city || null,
      status: status ?? "UPCOMING",
      matchDate: new Date(parsed.data.matchDate),
    },
  });

  await db.userActivityLog.create({
    data: { userId: session.user.id, action: "MATCH_CREATED", entityType: "Match", entityId: match.id },
  });

  return NextResponse.json({ success: true, match }, { status: 201 });
}

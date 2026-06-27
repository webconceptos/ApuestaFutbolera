import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePoolRole } from "@/lib/require-pool-role";
import { calculatePoints, getPhaseMultiplier } from "@/lib/scoring";

const schema = z.object({
  matchId: z.string().min(1),
  entries: z
    .array(
      z.object({
        userId: z.string().min(1),
        homeScore: z.coerce.number().int().min(0).max(20),
        awayScore: z.coerce.number().int().min(0).max(20),
      })
    )
    .min(1)
    .max(200),
});

// Ingreso de predicciones en nombre de los participantes — solo OWNER o MODERATOR.
// No aplica el deadline habitual (los participantes enviaron sus predicciones en
// papel y el admin las carga). Si el partido ya tiene resultado, calcula y guarda
// los puntos de inmediato para que el recálculo de ranking quede correcto.
export async function POST(request: NextRequest, { params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params;
  const ctx = await requirePoolRole(poolId, ["OWNER", "MODERATOR"]);
  if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const { matchId, entries } = parsed.data;

  const [match, pool] = await Promise.all([
    db.match.findUnique({ where: { id: matchId } }),
    db.pool.findUnique({ where: { id: poolId }, include: { config: true } }),
  ]);

  if (!match) return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  if (!pool || !pool.config) return NextResponse.json({ error: "Polla no encontrada" }, { status: 404 });
  if (match.tournamentId !== pool.tournamentId) {
    return NextResponse.json({ error: "El partido no pertenece al torneo de esta polla" }, { status: 400 });
  }

  const hasResult = match.homeScore !== null && match.awayScore !== null;

  let saved = 0;
  for (const entry of entries) {
    const member = await db.poolMember.findUnique({
      where: { poolId_userId: { poolId, userId: entry.userId } },
    });
    if (!member || !member.isActive) continue;

    let pointsEarned = 0;
    let resultType: "NONE" | "CORRECT_RESULT" | "CORRECT_DIFF" | "EXACT_SCORE" = "NONE";
    let isScored = false;

    if (hasResult) {
      const phaseMultiplier = getPhaseMultiplier(match.phase, pool.config);
      const calc = calculatePoints(
        { homeScore: entry.homeScore, awayScore: entry.awayScore },
        { homeScore: match.homeScore!, awayScore: match.awayScore! },
        pool.config,
        phaseMultiplier
      );
      pointsEarned = calc.points;
      resultType = calc.resultType;
      isScored = true;
    }

    await db.prediction.upsert({
      where: { poolId_userId_matchId: { poolId, userId: entry.userId, matchId } },
      create: {
        poolId,
        userId: entry.userId,
        matchId,
        homeScore: entry.homeScore,
        awayScore: entry.awayScore,
        pointsEarned,
        resultType,
        isScored,
        submittedAt: new Date(),
      },
      update: {
        homeScore: entry.homeScore,
        awayScore: entry.awayScore,
        pointsEarned,
        resultType,
        isScored,
        editedAt: new Date(),
      },
    });
    saved++;
  }

  await db.userActivityLog.create({
    data: {
      userId: ctx.session.user.id,
      action: "PREDICTION_CREATED",
      entityType: "Pool",
      entityId: poolId,
      metadata: { matchId, entriesSubmitted: saved, adminEntry: true },
    },
  });

  return NextResponse.json({ saved });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePoolRole } from "@/lib/require-pool-role";
import { calculatePoints, getPhaseMultiplier } from "@/lib/scoring";

const schema = z.object({
  userId: z.string().min(1),
  entries: z
    .array(
      z.object({
        matchId: z.string().min(1),
        homeScore: z.coerce.number().int().min(0).max(20),
        awayScore: z.coerce.number().int().min(0).max(20),
      })
    )
    .min(1)
    .max(200),
});

// Variante del ingreso admin organizada por participante en lugar de por partido.
// Recibe un userId + todas sus predicciones a guardar de una vez.
export async function POST(request: NextRequest, { params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params;
  const ctx = await requirePoolRole(poolId, ["OWNER", "MODERATOR"]);
  if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const { userId, entries } = parsed.data;

  const [member, pool] = await Promise.all([
    db.poolMember.findUnique({ where: { poolId_userId: { poolId, userId } } }),
    db.pool.findUnique({ where: { id: poolId }, include: { config: true } }),
  ]);

  if (!member || !member.isActive) {
    return NextResponse.json({ error: "El participante no es miembro activo de esta polla" }, { status: 400 });
  }
  if (!pool || !pool.config) {
    return NextResponse.json({ error: "Polla no encontrada" }, { status: 404 });
  }

  const matchIds = entries.map((e) => e.matchId);
  const matches = await db.match.findMany({
    where: { id: { in: matchIds }, tournamentId: pool.tournamentId },
  });
  const matchMap = new Map(matches.map((m) => [m.id, m]));

  let saved = 0;
  for (const entry of entries) {
    const match = matchMap.get(entry.matchId);
    if (!match) continue;

    const hasResult = match.homeScore !== null && match.awayScore !== null;
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
      where: { poolId_userId_matchId: { poolId, userId, matchId: entry.matchId } },
      create: {
        poolId,
        userId,
        matchId: entry.matchId,
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
      metadata: { targetUserId: userId, entriesSubmitted: saved, adminEntry: true },
    },
  });

  return NextResponse.json({ saved });
}

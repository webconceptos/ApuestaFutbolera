import { db } from "@/lib/db";
import { calculatePoints, calculateRanking, getPhaseMultiplier, type RankingMember } from "@/lib/scoring";
import { invalidatePoolRankingCache } from "@/lib/redis";
import { notifyUser } from "@/lib/notifications";

function pointsMessage(points: number, resultType: string) {
  if (resultType === "EXACT_SCORE") return `+${points} pts (marcador exacto)`;
  if (resultType === "CORRECT_DIFF") return `+${points} pts (diferencia de gol correcta)`;
  if (resultType === "CORRECT_RESULT") return `+${points} pts (resultado correcto)`;
  return "0 pts";
}

/**
 * Se ejecuta cada vez que el superadmin (o un manager autorizado) ingresa el
 * resultado de un partido. Recorre TODAS las predicciones de ese partido en
 * TODAS las pollas, calcula puntos con el motor puro de scoring.ts, y
 * recalcula el ranking de cada polla afectada. Ver Paso 19 en CLAUDE.md.
 */
export async function runScoringBatch(matchId: string) {
  const match = await db.match.findUniqueOrThrow({ where: { id: matchId } });
  if (match.homeScore === null || match.awayScore === null) {
    throw new Error("El partido todavía no tiene resultado");
  }
  const result = { homeScore: match.homeScore, awayScore: match.awayScore };

  const predictions = await db.prediction.findMany({
    where: { matchId },
    include: { pool: { include: { config: true } } },
  });

  const affectedPoolIds = new Set<string>();
  let exactCount = 0;

  for (const prediction of predictions) {
    const config = prediction.pool.config;
    if (!config) continue; // PoolConfig siempre se crea junto con el Pool (Paso 15); defensivo.

    const phaseMultiplier = getPhaseMultiplier(match.phase, config);
    const { points, resultType } = calculatePoints(
      { homeScore: prediction.homeScore, awayScore: prediction.awayScore },
      result,
      config,
      phaseMultiplier
    );

    if (resultType === "EXACT_SCORE") exactCount++;
    affectedPoolIds.add(prediction.poolId);

    await db.prediction.update({
      where: { id: prediction.id },
      data: { pointsEarned: points, resultType, isScored: true },
    });

    await notifyUser({
      userId: prediction.userId,
      poolId: prediction.poolId,
      type: "RESULT_SCORED",
      title: `${match.homeTeam} vs ${match.awayTeam}`,
      message: `${pointsMessage(points, resultType)}: predijiste ${prediction.homeScore}-${prediction.awayScore}, el resultado fue ${result.homeScore}-${result.awayScore}.`,
      metadata: { matchId, pointsEarned: points, resultType },
    });
  }

  for (const poolId of affectedPoolIds) {
    await recalculatePoolRanking(poolId);
  }

  return { predictionsProcessed: predictions.length, poolsAffected: affectedPoolIds.size, exactCount };
}

export async function recalculatePoolRanking(poolId: string) {
  const pool = await db.pool.findUniqueOrThrow({ where: { id: poolId }, include: { config: true } });
  if (!pool.config) return;

  const members = await db.poolMember.findMany({
    where: { poolId, isActive: true },
    include: { user: { select: { id: true, name: true } } },
  });
  if (members.length === 0) return;

  const predictionsRaw = await db.prediction.findMany({
    where: { poolId, userId: { in: members.map((m) => m.userId) } },
    include: { match: { select: { homeScore: true, awayScore: true, matchDate: true } } },
  });

  // Si la polla tiene un "arranca a contar desde" configurado (Configuración
  // → Puntuación), las predicciones de partidos anteriores a esa fecha
  // quedan afuera del ranking — siguen guardadas con sus puntos calculados
  // en la predicción individual, solo no suman al total de la polla.
  const cutoffStart = pool.config.scoringStartDate;
  const cutoffEnd = pool.config.scoringEndDate;
  const predictions =
    cutoffStart || cutoffEnd
      ? predictionsRaw.filter((p) => {
          if (cutoffStart && p.match.matchDate < cutoffStart) return false;
          if (cutoffEnd && p.match.matchDate > cutoffEnd) return false;
          return true;
        })
      : predictionsRaw;

  const predictionsByUser = new Map<string, typeof predictions>();
  for (const p of predictions) {
    const list = predictionsByUser.get(p.userId) ?? [];
    list.push(p);
    predictionsByUser.set(p.userId, list);
  }

  const rankingInput: RankingMember[] = members.map((m) => ({
    userId: m.userId,
    name: m.user.name,
    joinedAt: m.joinedAt,
    predictions: (predictionsByUser.get(m.userId) ?? []).map((p) => ({
      resultType: p.resultType,
      pointsEarned: p.pointsEarned,
      homeScore: p.homeScore,
      awayScore: p.awayScore,
      matchHomeScore: p.match.homeScore,
      matchAwayScore: p.match.awayScore,
    })),
  }));

  const ranked = calculateRanking(rankingInput, pool.config);
  const previousPositions = new Map(members.map((m) => [m.userId, m.rankPosition]));

  for (const r of ranked) {
    const member = members.find((m) => m.userId === r.userId);
    if (!member) continue;

    await db.poolMember.update({
      where: { id: member.id },
      data: {
        totalPoints: r.totalPoints,
        exactScores: r.exactScores,
        previousRankPosition: member.rankPosition,
        rankPosition: r.position,
      },
    });

    const previousPosition = previousPositions.get(r.userId);
    if (previousPosition != null && previousPosition !== r.position) {
      const rankUp = r.position < previousPosition;
      await notifyUser({
        userId: r.userId,
        poolId,
        type: rankUp ? "RANK_UP" : "RANK_DOWN",
        title: rankUp ? "¡Subiste de posición!" : "Bajaste de posición",
        message: `Ahora estás en el puesto #${r.position} de "${pool.name}" (antes #${previousPosition}).`,
        metadata: { from: previousPosition, to: r.position },
      });
    }
  }

  await invalidatePoolRankingCache(poolId);
}

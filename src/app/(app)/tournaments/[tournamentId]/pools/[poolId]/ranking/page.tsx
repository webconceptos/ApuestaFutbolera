import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePoolRole } from "@/lib/require-pool-role";
import { db } from "@/lib/db";
import { Podium } from "@/components/ranking/podium";
import { RankingTable } from "@/components/ranking/ranking-table";
import { PointsEvolutionChart, type EvolutionPoint } from "@/components/ranking/points-evolution-chart";

export default async function RankingPage({
  params,
}: {
  params: Promise<{ tournamentId: string; poolId: string }>;
}) {
  const { tournamentId, poolId } = await params;
  const ctx = await requirePoolRole(poolId, ["PLAYER", "MODERATOR", "OWNER"]);
  if (!ctx) notFound();

  const pool = await db.pool.findUnique({ where: { id: poolId }, include: { config: true } });
  if (!pool || pool.tournamentId !== tournamentId) notFound();

  const members = await db.poolMember.findMany({
    where: { poolId, isActive: true },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: [{ rankPosition: "asc" }, { totalPoints: "desc" }],
  });

  const scoredPredictions = await db.prediction.findMany({
    where: { poolId, isScored: true },
    select: {
      userId: true,
      matchId: true,
      pointsEarned: true,
      match: { select: { matchDate: true, homeTeam: true, awayTeam: true } },
    },
  });

  const rows = members.map((m) => ({
    userId: m.userId,
    name: m.user.name,
    totalPoints: m.totalPoints,
    exactScores: m.exactScores,
    rankPosition: m.rankPosition,
    previousRankPosition: m.previousRankPosition,
    isMe: m.userId === ctx.session.user.id,
  }));

  const top3 = rows
    .filter((r) => r.rankPosition !== null && r.rankPosition <= 3)
    .sort((a, b) => (a.rankPosition ?? 99) - (b.rankPosition ?? 99));

  // Evolución de puntos: acumulado por miembro en orden cronológico de partidos puntuados.
  const matchesById = new Map<string, { label: string; date: Date }>();
  for (const p of scoredPredictions) {
    if (!matchesById.has(p.matchId)) {
      matchesById.set(p.matchId, { label: `${p.match.homeTeam} vs ${p.match.awayTeam}`, date: p.match.matchDate });
    }
  }
  const matchesInOrder = Array.from(matchesById.entries())
    .map(([matchId, info]) => ({ matchId, ...info }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const pointsByMatchAndUser = new Map<string, number>();
  for (const p of scoredPredictions) pointsByMatchAndUser.set(`${p.matchId}:${p.userId}`, p.pointsEarned);

  const cumulative = new Map(members.map((m) => [m.userId, 0]));
  const evolutionData: EvolutionPoint[] = matchesInOrder.map((match) => {
    const point: EvolutionPoint = { label: match.label };
    for (const m of members) {
      const earned = pointsByMatchAndUser.get(`${match.matchId}:${m.userId}`) ?? 0;
      const updated = (cumulative.get(m.userId) ?? 0) + earned;
      cumulative.set(m.userId, updated);
      point[m.userId] = updated;
    }
    return point;
  });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-text-primary">Ranking · {pool.name}</h1>
          <p className="text-sm text-text-muted">Posiciones actualizadas tras cada resultado ingresado.</p>
        </div>
        <Link
          href={`/tournaments/${tournamentId}/pools/${poolId}`}
          className="text-sm text-gold-start hover:underline"
        >
          ← Volver a la polla
        </Link>
      </div>

      {top3.length > 0 && <Podium top3={top3} />}

      <RankingTable rows={rows} accentColor={pool.config?.accentColor} />

      {evolutionData.length > 0 && (
        <PointsEvolutionChart data={evolutionData} members={rows.map((r) => ({ userId: r.userId, name: r.name }))} />
      )}
    </div>
  );
}

import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { isPredictionOpen, predictionDeadline } from "@/lib/deadline";
import { PredictionsList } from "./predictions-list";

export default async function PredictionsPage({
  params,
}: {
  params: Promise<{ tournamentId: string; poolId: string }>;
}) {
  const { tournamentId, poolId } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const pool = await db.pool.findUnique({ where: { id: poolId }, include: { config: true } });
  if (!pool || pool.tournamentId !== tournamentId) notFound();

  const membership = await db.poolMember.findUnique({
    where: { poolId_userId: { poolId, userId: session.user.id } },
  });

  if (!membership || !membership.isActive) {
    return (
      <GlassCard className="mx-auto max-w-lg text-center">
        <p className="text-text-muted">No formas parte de esta polla.</p>
      </GlassCard>
    );
  }

  const deadlineHours = pool.config?.predictionDeadlineHours ?? 1;

  const [matches, predictions] = await Promise.all([
    db.match.findMany({ where: { tournamentId }, orderBy: { matchNumber: "asc" } }),
    db.prediction.findMany({ where: { poolId, userId: session.user.id } }),
  ]);

  const predictionByMatch = new Map(predictions.map((p) => [p.matchId, p]));

  const matchesWithPredictions = matches.map((m) => {
    const existing = predictionByMatch.get(m.id);
    return {
      id: m.id,
      phase: m.phase,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeFlag: m.homeFlag,
      awayFlag: m.awayFlag,
      matchDate: m.matchDate.toISOString(),
      deadlineIso: predictionDeadline(m.matchDate, deadlineHours).toISOString(),
      status: m.status,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      isOpen: isPredictionOpen(m.matchDate, deadlineHours, m.status),
      existing: existing ? { homeScore: existing.homeScore, awayScore: existing.awayScore } : null,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-text-primary">Predicciones · {pool.name}</h1>
        <p className="text-sm text-text-muted">Apuesta el marcador exacto de cada partido antes de que cierre.</p>
      </div>

      <PredictionsList
        poolId={poolId}
        matches={matchesWithPredictions}
        canPredict={!pool.config?.entryFeeEnabled || membership.hasPaid}
      />
    </div>
  );
}

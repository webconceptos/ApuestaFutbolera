import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { MyPredictionsList } from "./my-predictions-list";

export default async function MyPredictionsPage({
  params,
}: {
  params: Promise<{ tournamentId: string; poolId: string }>;
}) {
  const { tournamentId, poolId } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const pool = await db.pool.findUnique({ where: { id: poolId } });
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

  const [matches, predictions] = await Promise.all([
    db.match.findMany({ where: { tournamentId }, orderBy: { matchNumber: "asc" } }),
    db.prediction.findMany({ where: { poolId, userId: session.user.id } }),
  ]);

  const predictionByMatch = new Map(predictions.map((p) => [p.matchId, p]));

  const rows = matches.map((m) => {
    const prediction = predictionByMatch.get(m.id);

    let status: "sin_apostar" | "pendiente" | "acertado" | "fallado" = "sin_apostar";
    if (prediction) {
      if (!prediction.isScored) status = "pendiente";
      else status = prediction.pointsEarned > 0 ? "acertado" : "fallado";
    }

    return {
      matchId: m.id,
      phase: m.phase,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeFlag: m.homeFlag,
      awayFlag: m.awayFlag,
      matchDate: m.matchDate.toISOString(),
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      predictedHome: prediction?.homeScore ?? null,
      predictedAway: prediction?.awayScore ?? null,
      resultType: prediction?.resultType ?? null,
      pointsEarned: prediction?.pointsEarned ?? null,
      status,
    };
  });

  const scored = rows.filter((r) => r.status === "acertado" || r.status === "fallado");
  const summary = {
    totalPoints: rows.reduce((acc, r) => acc + (r.pointsEarned ?? 0), 0),
    exactScores: rows.filter((r) => r.resultType === "EXACT_SCORE").length,
    accuracy: scored.length > 0 ? Math.round((scored.filter((r) => r.status === "acertado").length / scored.length) * 100) : null,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-text-primary">Mis apuestas · {pool.name}</h1>
        <p className="text-sm text-text-muted">Historial completo de tus predicciones en esta polla.</p>
      </div>

      <MyPredictionsList rows={rows} summary={summary} />
    </div>
  );
}

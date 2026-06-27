import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePoolRole } from "@/lib/require-pool-role";
import { GlassCard } from "@/components/ui/glass-card";
import { ScoringSettingsForm } from "../scoring-settings-form";

export default async function ScoringSettingsPage({
  params,
}: {
  params: Promise<{ tournamentId: string; poolId: string }>;
}) {
  const { tournamentId, poolId } = await params;
  const ctx = await requirePoolRole(poolId, ["OWNER"]);
  if (!ctx) redirect(`/tournaments/${tournamentId}/pools/${poolId}/settings/members`);

  const config = await db.poolConfig.findUnique({ where: { poolId } });
  if (!config) notFound();

  return (
    <GlassCard>
      <h2 className="font-display text-xl tracking-wide text-text-primary">Puntuación</h2>
      <p className="mt-1 text-sm text-text-muted">
        Cuánto vale cada tipo de acierto, los multiplicadores por fase y los criterios de desempate.
      </p>
      <div className="mt-4">
        <ScoringSettingsForm
          poolId={poolId}
          initial={{
            predictionDeadlineHours: config.predictionDeadlineHours,
            pointsExactScore: config.pointsExactScore,
            pointsCorrectResult: config.pointsCorrectResult,
            pointsCorrectGoalDiff: config.pointsCorrectGoalDiff,
            bonusKnockout: config.bonusKnockout,
            bonusFinal: config.bonusFinal,
            tiebreakerCriteria: config.tiebreakerCriteria,
            scoringStartDate: config.scoringStartDate ? config.scoringStartDate.toISOString() : null,
            scoringEndDate: config.scoringEndDate ? config.scoringEndDate.toISOString() : null,
          }}
        />
      </div>
    </GlassCard>
  );
}

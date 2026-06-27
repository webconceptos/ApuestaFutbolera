import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePoolRole } from "@/lib/require-pool-role";
import { GlassCard } from "@/components/ui/glass-card";
import { VisibilitySettingsForm } from "../visibility-settings-form";

export default async function VisibilitySettingsPage({
  params,
}: {
  params: Promise<{ tournamentId: string; poolId: string }>;
}) {
  const { tournamentId, poolId } = await params;
  const ctx = await requirePoolRole(poolId, ["OWNER"]);
  if (!ctx) redirect(`/tournaments/${tournamentId}/pools/${poolId}/settings/members`);

  const pool = await db.pool.findUnique({ where: { id: poolId }, include: { config: true } });
  if (!pool || !pool.config) notFound();

  return (
    <GlassCard>
      <h2 className="font-display text-xl tracking-wide text-text-primary">Visibilidad</h2>
      <p className="mt-1 text-sm text-text-muted">Quién puede unirse y qué pueden ver los miembros y el público.</p>
      <div className="mt-4">
        <VisibilitySettingsForm
          poolId={poolId}
          initial={{
            inviteOnly: pool.inviteOnly,
            isPublic: pool.isPublic,
            registrationOpen: pool.config.registrationOpen,
            maxMembers: pool.config.maxMembers,
            publicPanelEnabled: pool.config.publicPanelEnabled,
            publicShowRanking: pool.config.publicShowRanking,
            publicShowPredictions: pool.config.publicShowPredictions,
            publicShowFixture: pool.config.publicShowFixture,
            showOthersPredictions: pool.config.showOthersPredictions,
          }}
        />
      </div>
    </GlassCard>
  );
}

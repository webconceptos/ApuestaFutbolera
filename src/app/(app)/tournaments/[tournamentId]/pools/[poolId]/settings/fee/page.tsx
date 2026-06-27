import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePoolRole } from "@/lib/require-pool-role";
import { GlassCard } from "@/components/ui/glass-card";
import { FeeSettingsForm } from "../fee-settings-form";

export default async function FeeSettingsPage({
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
      <h2 className="font-display text-xl tracking-wide text-text-primary">Cuota</h2>
      <p className="mt-1 text-sm text-text-muted">Configura el costo de entrada, instrucciones de pago y el premio.</p>
      <div className="mt-4">
        <FeeSettingsForm
          poolId={poolId}
          initial={{
            entryFeeEnabled: config.entryFeeEnabled,
            entryFeeAmount: config.entryFeeAmount,
            entryFeeCurrency: config.entryFeeCurrency,
            entryFeeInstructions: config.entryFeeInstructions ?? "",
            prizeDescription: config.prizeDescription ?? "",
          }}
        />
      </div>
    </GlassCard>
  );
}

import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePoolRole } from "@/lib/require-pool-role";
import { GlassCard } from "@/components/ui/glass-card";
import { GeneralSettingsForm } from "./general-settings-form";

export default async function GeneralSettingsPage({
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
      <h2 className="font-display text-xl tracking-wide text-text-primary">General</h2>
      <p className="mt-1 text-sm text-text-muted">Nombre, descripción, color de acento y contenido de bienvenida.</p>
      <div className="mt-4">
        <GeneralSettingsForm
          poolId={poolId}
          initial={{
            name: pool.name,
            description: pool.description ?? "",
            logo: pool.logo ?? "",
            accentColor: pool.config.accentColor,
            welcomeMessage: pool.config.welcomeMessage ?? "",
            rules: pool.config.rules ?? "",
          }}
        />
      </div>
    </GlassCard>
  );
}

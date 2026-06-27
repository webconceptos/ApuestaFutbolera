import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePoolRole } from "@/lib/require-pool-role";
import { GlassCard } from "@/components/ui/glass-card";
import { TransferOwnershipForm } from "../transfer-ownership-form";
import { DeletePoolForm } from "../delete-pool-form";

export default async function DangerSettingsPage({
  params,
}: {
  params: Promise<{ tournamentId: string; poolId: string }>;
}) {
  const { tournamentId, poolId } = await params;
  const ctx = await requirePoolRole(poolId, ["OWNER"]);
  if (!ctx) redirect(`/tournaments/${tournamentId}/pools/${poolId}/settings/members`);

  const pool = await db.pool.findUnique({ where: { id: poolId } });
  if (!pool) notFound();

  const moderators = await db.poolMember.findMany({
    where: { poolId, role: "MODERATOR", isActive: true },
    include: { user: { select: { name: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <GlassCard className="border-l-4 border-warning">
        <h2 className="font-display text-xl tracking-wide text-text-primary">Transferir propiedad</h2>
        <div className="mt-4">
          <TransferOwnershipForm
            poolId={poolId}
            moderators={moderators.map((m) => ({ id: m.id, name: m.user.name }))}
          />
        </div>
      </GlassCard>

      <GlassCard className="border-l-4 border-error">
        <h2 className="font-display text-xl tracking-wide text-error">Eliminar polla</h2>
        <div className="mt-4">
          <DeletePoolForm poolId={poolId} />
        </div>
      </GlassCard>
    </div>
  );
}

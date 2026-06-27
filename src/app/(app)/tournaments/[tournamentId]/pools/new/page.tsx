import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import { GlassCard } from "@/components/ui/glass-card";
import { PoolCreateForm } from "./pool-create-form";

export default async function NewPoolPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;

  // Crear pollas es solo para administradores (SUPERADMIN/TOURNAMENT_MANAGER).
  const session = await requireRole("SUPERADMIN", "TOURNAMENT_MANAGER");
  if (!session) redirect(`/tournaments/${tournamentId}`);

  const tournament = await db.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament || !tournament.isActive) notFound();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="font-display text-3xl tracking-wide text-text-primary">Crear polla · {tournament.shortName}</h1>
      <GlassCard>
        <PoolCreateForm tournamentId={tournamentId} />
      </GlassCard>
    </div>
  );
}

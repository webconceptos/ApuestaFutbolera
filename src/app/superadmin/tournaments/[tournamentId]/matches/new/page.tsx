import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { MatchForm } from "../match-form";

export default async function NewMatchPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  const tournament = await db.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-display text-3xl tracking-wide text-text-primary">Nuevo partido · {tournament.shortName}</h1>
      <GlassCard>
        <MatchForm tournamentId={tournamentId} />
      </GlassCard>
    </div>
  );
}

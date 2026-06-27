import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { secondaryButtonClass } from "@/components/ui/form-styles";
import { TournamentForm } from "../tournament-form";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function EditTournamentPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    include: { _count: { select: { matches: true, pools: true, managers: true } } },
  });

  if (!tournament) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-text-primary">{tournament.shortName}</h1>
        <p className="text-sm text-text-muted">
          {tournament._count.matches} partidos · {tournament._count.pools} pollas
        </p>
      </div>

      <GlassCard>
        <TournamentForm
          tournamentId={tournament.id}
          initial={{
            name: tournament.name,
            shortName: tournament.shortName,
            logo: tournament.logo ?? "",
            sport: tournament.sport,
            country: tournament.country ?? "",
            season: tournament.season,
            startDate: toDateInputValue(tournament.startDate),
            endDate: toDateInputValue(tournament.endDate),
            isPublic: tournament.isPublic,
            description: tournament.description ?? "",
          }}
        />
      </GlassCard>

      <GlassCard className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl tracking-wide text-text-primary">Partidos</h3>
          <p className="text-sm text-text-muted">{tournament._count.matches} partidos cargados</p>
        </div>
        <Link href={`/superadmin/tournaments/${tournament.id}/matches`} className={secondaryButtonClass}>
          Gestionar partidos
        </Link>
      </GlassCard>

      <GlassCard className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl tracking-wide text-text-primary">Managers</h3>
          <p className="text-sm text-text-muted">{tournament._count.managers} managers asignados</p>
        </div>
        <Link href={`/superadmin/tournaments/${tournament.id}/managers`} className={secondaryButtonClass}>
          Gestionar managers
        </Link>
      </GlassCard>
    </div>
  );
}

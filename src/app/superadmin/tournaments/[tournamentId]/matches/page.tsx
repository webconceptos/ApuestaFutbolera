import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { buttonClass } from "@/components/ui/form-styles";
import { MatchList } from "./match-list";

export default async function MatchesPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;

  const tournament = await db.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) notFound();

  const matches = await db.match.findMany({
    where: { tournamentId },
    orderBy: { matchNumber: "asc" },
    include: { _count: { select: { predictions: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-text-primary">Partidos · {tournament.shortName}</h1>
          <p className="text-sm text-text-muted">{matches.length} partidos en total</p>
        </div>
        <Link href={`/superadmin/tournaments/${tournamentId}/matches/new`} className={buttonClass}>
          + Nuevo partido
        </Link>
      </div>

      <GlassCard>
        <MatchList
          tournamentId={tournamentId}
          matches={matches.map((m) => ({
            id: m.id,
            matchNumber: m.matchNumber,
            phase: m.phase,
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            homeFlag: m.homeFlag,
            awayFlag: m.awayFlag,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            matchDate: m.matchDate.toISOString(),
            status: m.status,
            predictionCount: m._count.predictions,
          }))}
        />
      </GlassCard>
    </div>
  );
}

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { MatchForm } from "../match-form";
import { ResultForm } from "./result-form";

export default async function EditMatchPage({
  params,
}: {
  params: Promise<{ tournamentId: string; matchId: string }>;
}) {
  const { tournamentId, matchId } = await params;

  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match || match.tournamentId !== tournamentId) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-display text-3xl tracking-wide text-text-primary">
        {match.homeFlag} {match.homeTeam} vs {match.awayTeam} {match.awayFlag}
      </h1>

      <GlassCard>
        <ResultForm
          tournamentId={tournamentId}
          matchId={matchId}
          initialHomeScore={match.homeScore}
          initialAwayScore={match.awayScore}
        />
      </GlassCard>

      <GlassCard>
        <MatchForm
          tournamentId={tournamentId}
          matchId={matchId}
          initial={{
            phase: match.phase,
            round: match.round?.toString() ?? "",
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            homeFlag: match.homeFlag,
            awayFlag: match.awayFlag,
            // ISO completo (con offset UTC): MatchForm ya convierte a hora de
            // Lima con toDatetimeLocalPeru(). Si se trunca acá antes (como
            // antes con .slice(0, 16)), se pierde el offset y el navegador
            // del admin reinterpreta el string truncado en SU propia zona
            // horaria local en vez de la de Lima.
            matchDate: match.matchDate.toISOString(),
            venue: match.venue ?? "",
            city: match.city ?? "",
            status: match.status,
          }}
        />
      </GlassCard>
    </div>
  );
}

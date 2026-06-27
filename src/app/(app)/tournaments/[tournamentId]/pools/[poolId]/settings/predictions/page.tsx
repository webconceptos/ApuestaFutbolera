import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePoolRole } from "@/lib/require-pool-role";
import { isPredictionOpen } from "@/lib/deadline";
import { AllPredictionsView } from "./all-predictions-view";

export default async function AllPredictionsPage({
  params,
}: {
  params: Promise<{ tournamentId: string; poolId: string }>;
}) {
  const { tournamentId, poolId } = await params;
  const ctx = await requirePoolRole(poolId, ["OWNER", "MODERATOR"]);
  if (!ctx) redirect(`/tournaments/${tournamentId}/pools/${poolId}`);

  const pool = await db.pool.findUnique({ where: { id: poolId }, include: { config: true } });
  if (!pool || pool.tournamentId !== tournamentId) notFound();

  const deadlineHours = pool.config?.predictionDeadlineHours ?? 1;

  const [matches, predictions, members] = await Promise.all([
    db.match.findMany({ where: { tournamentId }, orderBy: { matchNumber: "asc" } }),
    db.prediction.findMany({
      where: { poolId },
      include: { user: { select: { id: true, name: true } } },
    }),
    db.poolMember.findMany({
      where: { poolId, isActive: true },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const predictionsByMatch = new Map<
    string,
    Map<string, { homeScore: number; awayScore: number; pointsEarned: number; resultType: string; isScored: boolean }>
  >();
  for (const p of predictions) {
    const map = predictionsByMatch.get(p.matchId) ?? new Map();
    map.set(p.userId, {
      homeScore: p.homeScore,
      awayScore: p.awayScore,
      pointsEarned: p.pointsEarned,
      resultType: p.resultType,
      isScored: p.isScored,
    });
    predictionsByMatch.set(p.matchId, map);
  }

  const memberList = members.map((m) => ({ userId: m.userId, name: m.user.name }));

  const matchesData = matches.map((m) => {
    const picksForMatch = predictionsByMatch.get(m.id);
    // Antes de que cierre el plazo, no se revela el marcador que metió cada
    // quien — ni siquiera al OWNER/MODERATOR, porque en la práctica suelen
    // ser también jugadores de su propia polla: verlo antes les daría
    // ventaja desleal sobre el resto. Solo se muestra "apostó / no apostó".
    const revealScores = !isPredictionOpen(m.matchDate, deadlineHours, m.status);

    return {
      id: m.id,
      phase: m.phase,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeFlag: m.homeFlag,
      awayFlag: m.awayFlag,
      matchDate: m.matchDate.toISOString(),
      status: m.status,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      revealScores,
      picks: memberList.map((mem) => {
        const pick = picksForMatch?.get(mem.userId) ?? null;
        return {
          userId: mem.userId,
          name: mem.name,
          hasPredicted: pick !== null,
          prediction: revealScores && pick ? pick : null,
        };
      }),
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-muted">
        Quién apostó qué en cada partido. Antes de que cierre el plazo solo se ve si ya apostó o no — el marcador
        exacto recién se revela cuando arranca el partido, para no darle ventaja a nadie que también esté jugando.
      </p>
      <AllPredictionsView matches={matchesData} />
    </div>
  );
}

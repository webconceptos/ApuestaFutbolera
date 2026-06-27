import { notFound, redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePoolRole } from "@/lib/require-pool-role";
import { GlassCard } from "@/components/ui/glass-card";
import { EnterPredictionsGrid } from "./enter-predictions-grid";

export default async function EnterPredictionsPage({
  params,
}: {
  params: Promise<{ tournamentId: string; poolId: string }>;
}) {
  const { tournamentId, poolId } = await params;
  const ctx = await requirePoolRole(poolId, ["OWNER", "MODERATOR"]);
  if (!ctx) redirect(`/tournaments/${tournamentId}/pools/${poolId}`);

  const pool = await db.pool.findUnique({ where: { id: poolId }, include: { config: true } });
  if (!pool || pool.tournamentId !== tournamentId) notFound();

  const startDate = pool.config?.scoringStartDate ?? null;
  const endDate = pool.config?.scoringEndDate ?? null;

  // Filtrar partidos según ventana de puntuación si está configurada
  const matchWhere: Prisma.MatchWhereInput = {
    tournamentId,
    ...(startDate || endDate
      ? {
          matchDate: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        }
      : {}),
  };

  const [matches, predictions, members] = await Promise.all([
    db.match.findMany({ where: matchWhere, orderBy: { matchDate: "asc" } }),
    db.prediction.findMany({
      where: { poolId },
      select: { matchId: true, userId: true, homeScore: true, awayScore: true, isScored: true },
    }),
    db.poolMember.findMany({
      where: { poolId, isActive: true },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  // Construir mapa: matchId → userId → { homeScore, awayScore, isScored }
  const predsByMatch = new Map<
    string,
    Map<string, { homeScore: number; awayScore: number; isScored: boolean }>
  >();
  for (const p of predictions) {
    const map = predsByMatch.get(p.matchId) ?? new Map();
    map.set(p.userId, { homeScore: p.homeScore, awayScore: p.awayScore, isScored: p.isScored });
    predsByMatch.set(p.matchId, map);
  }

  const memberList = members.map((m) => ({ userId: m.userId, name: m.user.name }));

  const matchesData = matches.map((m) => ({
    id: m.id,
    phase: m.phase,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeFlag: m.homeFlag,
    awayFlag: m.awayFlag,
    matchDate: m.matchDate.toISOString(),
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    existingPredictions: Object.fromEntries(predsByMatch.get(m.id) ?? new Map()),
  }));

  const formatDateShort = (d: Date) =>
    d.toLocaleDateString("es-PE", { day: "numeric", month: "short", timeZone: "America/Lima" });

  return (
    <div className="flex flex-col gap-4">
      <GlassCard>
        <h2 className="font-display text-xl tracking-wide text-text-primary">Ingresar predicciones</h2>
        <p className="mt-1 text-sm text-text-muted">
          Ingresa las predicciones de cada participante en nombre de ellos — útil cuando los miembros enviaron
          sus apuestas en papel o por otro canal. Las predicciones existentes se muestran pre-cargadas y pueden
          sobreescribirse.
        </p>

        {(startDate || endDate) && (
          <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            Mostrando solo partidos de la ventana de puntuación configurada
            {startDate && endDate && (
              <>
                {" "}
                ({formatDateShort(startDate)} – {formatDateShort(endDate)}).
              </>
            )}
            {startDate && !endDate && <> (desde {formatDateShort(startDate)}).</>}
            {!startDate && endDate && <> (hasta {formatDateShort(endDate)}).</>}
            {" "}
            Para ver todos los partidos del torneo, quita las fechas en Configuración → Puntuación.
          </div>
        )}
      </GlassCard>

      <EnterPredictionsGrid poolId={poolId} matches={matchesData} members={memberList} />
    </div>
  );
}

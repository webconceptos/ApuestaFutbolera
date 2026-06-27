import type { Match } from "@prisma/client";
import { db } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { predictionDeadline } from "@/lib/deadline";

const WARNING_WINDOW_HOURS = 2;
const MAX_DEADLINE_HOURS = 72; // debe coincidir con el máximo de PoolConfig.predictionDeadlineHours

// Pensado para dispararse desde un cron externo (ver POST /api/cron/deadline-warnings),
// no hay scheduler dentro de Next.js. Avisa una sola vez por (usuario, partido):
// la deduplicación se hace consultando notificaciones DEADLINE_WARNING ya enviadas
// para ese matchId en metadata, en vez de llevar un estado aparte.
export async function runDeadlineWarnings() {
  const now = new Date();
  const horizon = new Date(now.getTime() + WARNING_WINDOW_HOURS * 60 * 60 * 1000);

  const matches = await db.match.findMany({
    where: {
      status: "UPCOMING",
      matchDate: { gte: now, lte: new Date(horizon.getTime() + MAX_DEADLINE_HOURS * 60 * 60 * 1000) },
    },
  });
  if (matches.length === 0) return { warningsSent: 0 };

  const matchesByTournament = new Map<string, Match[]>();
  for (const m of matches) {
    const list = matchesByTournament.get(m.tournamentId) ?? [];
    list.push(m);
    matchesByTournament.set(m.tournamentId, list);
  }

  let warningsSent = 0;

  for (const [tournamentId, tournamentMatches] of matchesByTournament) {
    const pools = await db.pool.findMany({
      where: { tournamentId, isActive: true },
      include: { config: true, members: { where: { isActive: true } } },
    });

    for (const pool of pools) {
      if (!pool.config) continue;
      // Si la polla no cobra cuota, hasPaid (false por default) no debe
      // excluir a nadie de los avisos — solo aplica el filtro cuando
      // entryFeeEnabled está activo.
      const eligibleMembers = pool.config.entryFeeEnabled ? pool.members.filter((m) => m.hasPaid) : pool.members;

      for (const match of tournamentMatches) {
        const deadline = predictionDeadline(match.matchDate, pool.config.predictionDeadlineHours);
        if (deadline < now || deadline > horizon) continue;

        const memberIds = eligibleMembers.map((m) => m.userId);
        if (memberIds.length === 0) continue;

        const predicted = await db.prediction.findMany({
          where: { poolId: pool.id, matchId: match.id, userId: { in: memberIds } },
          select: { userId: true },
        });
        const predictedSet = new Set(predicted.map((p) => p.userId));
        const pending = memberIds.filter((id) => !predictedSet.has(id));
        if (pending.length === 0) continue;

        const alreadyWarned = await db.notification.findMany({
          where: {
            type: "DEADLINE_WARNING",
            poolId: pool.id,
            userId: { in: pending },
            metadata: { path: ["matchId"], equals: match.id },
          },
          select: { userId: true },
        });
        const warnedSet = new Set(alreadyWarned.map((n) => n.userId));
        const toWarn = pending.filter((id) => !warnedSet.has(id));

        for (const userId of toWarn) {
          await notifyUser({
            userId,
            poolId: pool.id,
            type: "DEADLINE_WARNING",
            title: "Cierre de apuestas próximo",
            message: `${match.homeTeam} vs ${match.awayTeam} cierra pronto en "${pool.name}". ¡No olvides apostar!`,
            metadata: { matchId: match.id },
          });
          warningsSent++;
        }
      }
    }
  }

  return { warningsSent };
}

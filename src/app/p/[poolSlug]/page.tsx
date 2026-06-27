import { notFound } from "next/navigation";
import { cacheLife } from "next/cache";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ParticleBackground } from "@/components/effects/particle-background";
import { PublicHeader } from "@/components/public/public-header";
import { PublicRanking } from "@/components/public/public-ranking";
import { PublicRecentResults } from "@/components/public/public-recent-results";
import { PublicFixture } from "@/components/public/public-fixture";
import { PublicRules } from "@/components/public/public-rules";
import { predictionDeadline, formatTimeRemaining } from "@/lib/deadline";
import { formatDateTimePeru } from "@/lib/date-peru";

// Server Component puro: cachea con "use cache" (Next.js 16 + cacheComponents,
// ver next.config.ts) y revalida cada ~60s (perfil "minutes"), consulta la DB
// directamente, y no importa nada que use sesión (useSession/auth) — ver
// Paso 20 en CLAUDE.md. notFound()/redirect() quedan fuera del scope
// cacheado: solo se llaman desde el componente de página, no desde la
// función cacheada de datos.
async function getPoolPublicData(slug: string) {
  "use cache";
  cacheLife("minutes");

  const pool = await db.pool.findUnique({
    where: { slug },
    include: { config: true, tournament: true },
  });

  if (!pool || !pool.config?.publicPanelEnabled) return null;
  const config = pool.config;

  const [members, recentMatchesRaw, upcomingMatches, leader, nextMatch] = await Promise.all([
    config.publicShowRanking
      ? db.poolMember.findMany({
          where: { poolId: pool.id, isActive: true },
          include: { user: { select: { id: true, name: true } } },
          orderBy: [{ rankPosition: { sort: "asc", nulls: "last" } }, { totalPoints: "desc" }],
        })
      : Promise.resolve([]),
    db.match.findMany({
      where: { tournamentId: pool.tournamentId, status: "FINISHED" },
      orderBy: { matchDate: "desc" },
      take: 5,
    }),
    config.publicShowFixture
      ? db.match.findMany({
          where: { tournamentId: pool.tournamentId, status: "UPCOMING" },
          orderBy: { matchDate: "asc" },
          take: 5,
        })
      : Promise.resolve([]),
    db.poolMember.findFirst({
      where: { poolId: pool.id, isActive: true, rankPosition: { not: null } },
      orderBy: { rankPosition: "asc" },
      include: { user: { select: { name: true } } },
    }),
    db.match.findFirst({
      where: { tournamentId: pool.tournamentId, status: "UPCOMING" },
      orderBy: { matchDate: "asc" },
    }),
  ]);

  const recentMatches = recentMatchesRaw.filter((m) => m.homeScore !== null && m.awayScore !== null);

  let predictionsByMatch = new Map<string, { name: string; homeScore: number; awayScore: number }[]>();
  if (config.publicShowPredictions && recentMatches.length > 0) {
    const predictions = await db.prediction.findMany({
      where: { poolId: pool.id, matchId: { in: recentMatches.map((m) => m.id) } },
      include: { user: { select: { name: true } } },
    });
    predictionsByMatch = predictions.reduce((map, p) => {
      const list = map.get(p.matchId) ?? [];
      list.push({ name: p.user.name, homeScore: p.homeScore, awayScore: p.awayScore });
      map.set(p.matchId, list);
      return map;
    }, new Map<string, { name: string; homeScore: number; awayScore: number }[]>());
  }

  return { pool, config, members, recentMatches, upcomingMatches, predictionsByMatch, leader, nextMatch };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ poolSlug: string }>;
}): Promise<Metadata> {
  const { poolSlug } = await params;
  const data = await getPoolPublicData(poolSlug);
  if (!data) return { title: "Golazo Mundial" };

  const { pool, leader, nextMatch } = data;
  const title = `${pool.name} · ${pool.tournament.shortName}`;
  const description = [
    leader ? `Líder: ${leader.user.name} con ${leader.totalPoints} pts.` : null,
    nextMatch ? `Próximo: ${nextMatch.homeTeam} vs ${nextMatch.awayTeam}.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    title,
    description: description || `Ranking y resultados de "${pool.name}" en Golazo Mundial.`,
    openGraph: { title, description },
  };
}

export default async function PublicPoolPage({
  params,
}: {
  params: Promise<{ poolSlug: string }>;
}) {
  const { poolSlug } = await params;
  const data = await getPoolPublicData(poolSlug);
  if (!data) notFound();

  const { pool, config, members, recentMatches, upcomingMatches, predictionsByMatch } = data;

  const joinHref = pool.inviteOnly
    ? `/register?pool=${pool.id}&invite=${pool.inviteCode}`
    : `/register?pool=${pool.id}`;

  return (
    <main className="relative mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <ParticleBackground />

      <PublicHeader
        poolName={pool.name}
        poolDescription={pool.description}
        tournamentName={pool.tournament.shortName}
        accentColor={config.accentColor}
        joinHref={joinHref}
      />

      {config.rules && <PublicRules rules={config.rules} />}

      {config.publicShowRanking && (
        <PublicRanking
          poolSlug={pool.slug}
          rows={members.map((m) => ({
            userId: m.userId,
            name: m.user.name,
            totalPoints: m.totalPoints,
            exactScores: m.exactScores,
            rankPosition: m.rankPosition,
            previousRankPosition: m.previousRankPosition,
          }))}
        />
      )}

      <PublicRecentResults
        showPredictions={config.publicShowPredictions}
        matches={recentMatches.map((m) => ({
          id: m.id,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          homeFlag: m.homeFlag,
          awayFlag: m.awayFlag,
          homeScore: m.homeScore as number,
          awayScore: m.awayScore as number,
          phase: m.phase,
          predictions: predictionsByMatch.get(m.id) ?? [],
        }))}
      />

      {config.publicShowFixture && (
        <PublicFixture
          matches={upcomingMatches.map((m) => ({
            id: m.id,
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            homeFlag: m.homeFlag,
            awayFlag: m.awayFlag,
            matchDateLabel: formatDateTimePeru(m.matchDate),
            deadlineLabel: formatTimeRemaining(predictionDeadline(m.matchDate, config.predictionDeadlineHours)),
          }))}
        />
      )}
    </main>
  );
}

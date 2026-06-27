import { notFound } from "next/navigation";
import { cacheLife } from "next/cache";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ParticleBackground } from "@/components/effects/particle-background";
import { PublicPlayerProfile } from "@/components/public/public-player-profile";

// Mismo patrón de cacheo que /p/[poolSlug] (Paso 20): "use cache" + cacheLife,
// sin nada que dependa de sesión, notFound() fuera del scope cacheado.
async function getPlayerPublicData(slug: string, userId: string) {
  "use cache";
  cacheLife("minutes");

  const pool = await db.pool.findUnique({ where: { slug }, include: { config: true, tournament: true } });
  if (!pool || !pool.config?.publicPanelEnabled) return null;
  const config = pool.config;

  const member = await db.poolMember.findFirst({
    where: { poolId: pool.id, userId, isActive: true },
    include: { user: { select: { name: true, bio: true } } },
  });
  if (!member) return null;

  let predictions: Awaited<ReturnType<typeof loadPredictions>> = [];
  if (config.publicShowPredictions) {
    predictions = await loadPredictions(pool.id, userId);
  }

  return { pool, config, member, predictions };
}

async function loadPredictions(poolId: string, userId: string) {
  const rows = await db.prediction.findMany({
    where: { poolId, userId, isScored: true, match: { status: "FINISHED" } },
    include: { match: true },
    orderBy: { match: { matchDate: "desc" } },
  });

  return rows.map((p) => ({
    matchId: p.matchId,
    homeTeam: p.match.homeTeam,
    awayTeam: p.match.awayTeam,
    homeFlag: p.match.homeFlag,
    awayFlag: p.match.awayFlag,
    phase: p.match.phase,
    homeScore: p.match.homeScore as number,
    awayScore: p.match.awayScore as number,
    predictedHome: p.homeScore,
    predictedAway: p.awayScore,
    pointsEarned: p.pointsEarned,
    resultType: p.resultType,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ poolSlug: string; userId: string }>;
}): Promise<Metadata> {
  const { poolSlug, userId } = await params;
  const data = await getPlayerPublicData(poolSlug, userId);
  if (!data) return { title: "Golazo Mundial" };

  const { pool, member } = data;
  const title = `${member.user.name} · ${pool.name}`;
  const description = `Posición #${member.rankPosition ?? "—"} con ${member.totalPoints} pts en "${pool.name}".`;

  return { title, description, openGraph: { title, description } };
}

export default async function PublicPlayerPage({
  params,
}: {
  params: Promise<{ poolSlug: string; userId: string }>;
}) {
  const { poolSlug, userId } = await params;
  const data = await getPlayerPublicData(poolSlug, userId);
  if (!data) notFound();

  const { pool, config, member, predictions } = data;

  return (
    <main className="relative mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <ParticleBackground />

      <PublicPlayerProfile
        poolSlug={pool.slug}
        poolName={pool.name}
        accentColor={config.accentColor}
        name={member.user.name}
        bio={member.user.bio}
        rankPosition={member.rankPosition}
        totalPoints={member.totalPoints}
        exactScores={member.exactScores}
        joinedAtLabel={member.joinedAt.toLocaleDateString("es-PE", { year: "numeric", month: "long" })}
        showPredictions={config.publicShowPredictions}
        predictions={predictions}
      />
    </main>
  );
}

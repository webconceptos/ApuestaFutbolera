import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { buttonClass } from "@/components/ui/form-styles";
import { JoinPublicPoolButton } from "./join-public-pool-button";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  const session = await auth();

  const tournament = await db.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament || !tournament.isActive) notFound();

  const pools = await db.pool.findMany({
    where: { tournamentId, isPublic: true, isActive: true },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" },
  });

  const myMemberships = session?.user
    ? await db.poolMember.findMany({
        where: { userId: session.user.id, pool: { tournamentId } },
        select: { poolId: true },
      })
    : [];
  const myPoolIds = new Set(myMemberships.map((m) => m.poolId));

  // Crear pollas es solo para administradores (SUPERADMIN/TOURNAMENT_MANAGER).
  const canCreatePool = session?.user.role === "SUPERADMIN" || session?.user.role === "TOURNAMENT_MANAGER";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-text-primary">{tournament.shortName}</h1>
          <p className="text-sm text-text-muted">
            {tournament.name} · {tournament.startDate.toLocaleDateString("es-PE")} –{" "}
            {tournament.endDate.toLocaleDateString("es-PE")}
          </p>
        </div>
        {canCreatePool && (
          <Link href={`/tournaments/${tournamentId}/pools/new`} className={buttonClass}>
            + Crear mi polla
          </Link>
        )}
      </div>

      {tournament.description && <p className="text-text-muted">{tournament.description}</p>}

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-2xl tracking-wide text-text-primary">Pollas públicas</h2>

        {pools.length === 0 && (
          <GlassCard>
            <p className="text-text-muted">
              Todavía no hay pollas públicas en este torneo.
              {canCreatePool && " ¡Crea la primera!"}
            </p>
          </GlassCard>
        )}

        {pools.map((pool) => (
          <GlassCard key={pool.id} accentColor="#F59E0B" className="flex items-center justify-between">
            <div>
              <Link href={`/tournaments/${tournamentId}/pools/${pool.id}`} className="font-medium text-text-primary hover:underline">
                {pool.name}
              </Link>
              {pool.description && <p className="text-sm text-text-muted">{pool.description}</p>}
              <p className="text-xs text-text-muted">{pool._count.members} participantes</p>
            </div>

            {myPoolIds.has(pool.id) ? (
              <Link href={`/tournaments/${tournamentId}/pools/${pool.id}`} className="text-sm text-gold-start hover:underline">
                Ya soy parte →
              </Link>
            ) : pool.inviteOnly ? (
              <span className="text-xs text-text-muted">Requiere invitación</span>
            ) : (
              <JoinPublicPoolButton tournamentId={tournamentId} poolId={pool.id} />
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

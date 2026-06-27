import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { buttonClass } from "@/components/ui/form-styles";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const memberships = await db.poolMember.findMany({
    where: { userId: session.user.id, isActive: true },
    include: { pool: { include: { tournament: true, config: true, _count: { select: { members: true } } } } },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-wide text-text-primary">Hola, {session.user.name}</h1>
        <Link href="/tournaments" className={buttonClass}>
          Buscar torneos
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-xl tracking-wide text-text-primary">Mis pollas</h2>

        {memberships.length === 0 ? (
          <GlassCard>
            <p className="text-text-muted">
              Todavía no formas parte de ninguna polla.{" "}
              <Link href="/tournaments" className="text-gold-start hover:underline">
                Explora los torneos disponibles
              </Link>{" "}
              para crear o unirte a una.
            </p>
          </GlassCard>
        ) : (
          memberships.map((m) => (
            <Link key={m.id} href={`/tournaments/${m.pool.tournamentId}/pools/${m.poolId}`}>
              <GlassCard accentColor="#F59E0B" className="flex items-center justify-between transition-colors hover:bg-white/10">
                <div>
                  <p className="font-medium text-text-primary">{m.pool.name}</p>
                  <p className="text-xs text-text-muted">
                    {m.pool.tournament.shortName} · {m.pool._count.members} participantes
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-text-primary">{m.totalPoints} pts</p>
                  {m.pool.config?.entryFeeEnabled && !m.hasPaid && m.role !== "OWNER" && (
                    <p className="text-xs text-warning">Pago pendiente</p>
                  )}
                </div>
              </GlassCard>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

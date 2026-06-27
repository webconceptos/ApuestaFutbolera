import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { CopyInviteLink } from "./copy-invite-link";

export default async function PoolDashboardPage({
  params,
}: {
  params: Promise<{ tournamentId: string; poolId: string }>;
}) {
  const { tournamentId, poolId } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const pool = await db.pool.findUnique({
    where: { id: poolId },
    include: { config: true, tournament: true, _count: { select: { members: true } } },
  });
  if (!pool || pool.tournamentId !== tournamentId) notFound();

  const membership = await db.poolMember.findUnique({
    where: { poolId_userId: { poolId, userId: session.user.id } },
  });

  const topMembers = membership?.isActive
    ? await db.poolMember.findMany({
        where: { poolId, isActive: true },
        include: { user: { select: { name: true } } },
        orderBy: [{ rankPosition: "asc" }, { totalPoints: "desc" }],
        take: 5,
      })
    : [];

  if (!membership || !membership.isActive) {
    return (
      <GlassCard className="mx-auto max-w-lg text-center">
        <h1 className="font-display text-2xl tracking-wide text-text-primary">{pool.name}</h1>
        <p className="mt-2 text-text-muted">
          No formas parte de esta polla todavía. Pídele a quien la organiza el link de invitación.
        </p>
      </GlassCard>
    );
  }

  const isOwner = membership.role === "OWNER";
  const canManageMembers = membership.role === "OWNER" || membership.role === "MODERATOR";
  const showPaymentBanner = pool.config?.entryFeeEnabled && !membership.hasPaid;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-text-primary">{pool.name}</h1>
        <p className="text-sm text-text-muted">
          {pool.tournament.shortName} · {pool._count.members} participantes
        </p>
      </div>

      {pool.config?.rules && (
        <GlassCard>
          <h3 className="font-display text-xl tracking-wide text-text-primary">📋 Reglas</h3>
          <div className="mt-2">
            <MarkdownContent content={pool.config.rules} />
          </div>
        </GlassCard>
      )}

      {showPaymentBanner && (
        <GlassCard className="border-l-4 border-warning">
          <p className="font-medium text-warning">Pago pendiente</p>
          <p className="mt-1 text-sm text-text-muted">
            {pool.config?.entryFeeInstructions ?? "Contacta al organizador de la polla para confirmar tu pago."}
          </p>
        </GlassCard>
      )}

      {isOwner && (
        <GlassCard className="flex flex-col gap-2">
          <h3 className="font-display text-xl tracking-wide text-text-primary">Invitar participantes</h3>
          <CopyInviteLink inviteCode={pool.inviteCode} poolSlug={pool.slug} inviteOnly={pool.inviteOnly} />
        </GlassCard>
      )}

      <Link
        href={`/tournaments/${tournamentId}/pools/${poolId}/predictions`}
        className="flex items-center justify-between rounded-2xl bg-gradient-main p-6 shadow-lg transition hover:opacity-90"
      >
        <div>
          <p className="font-display text-2xl tracking-wide text-white">⚽ Apostar ahora</p>
          <p className="mt-1 text-sm text-white/80">Predice el marcador de los partidos del torneo</p>
        </div>
        <span className="text-3xl text-white">→</span>
      </Link>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <NavTile
          href={`/tournaments/${tournamentId}/pools/${poolId}/ranking`}
          icon="🏆"
          title="Ranking"
          subtitle="Posiciones y tu lugar en la tabla"
        />
        <NavTile
          href={`/tournaments/${tournamentId}/pools/${poolId}/my-predictions`}
          icon="📜"
          title="Mis apuestas"
          subtitle="Historial y porcentaje de aciertos"
        />
        {pool.config?.publicPanelEnabled && (
          <NavTile
            href={`/p/${pool.slug}`}
            external
            icon="🌐"
            title="Panel público"
            subtitle="Ranking sin necesidad de iniciar sesión, para compartir"
          />
        )}
        {canManageMembers && (
          <NavTile
            href={`/tournaments/${tournamentId}/pools/${poolId}/settings/members`}
            icon="👥"
            title="Miembros"
            subtitle="Roles, pagos y participantes"
          />
        )}
      </div>

      <GlassCard className="p-0">
        <div className="flex items-center justify-between px-6 pt-6">
          <h3 className="font-display text-xl tracking-wide text-text-primary">Top 5</h3>
          <Link
            href={`/tournaments/${tournamentId}/pools/${poolId}/ranking`}
            className="text-sm text-gold-start hover:underline"
          >
            Ver ranking completo →
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-border-glass">
          {topMembers.map((m) => (
            <li
              key={m.id}
              className={`flex items-center justify-between px-6 py-2 text-sm ${
                m.userId === session.user.id ? "bg-gold-start/10" : ""
              }`}
            >
              <span className="text-text-primary">
                {m.rankPosition ?? "—"}. {m.user.name}
                {m.userId === session.user.id && <span className="ml-2 text-xs text-gold-start">(tú)</span>}
              </span>
              <span className="font-mono text-text-muted">{m.totalPoints} pts</span>
            </li>
          ))}
          {topMembers.length === 0 && (
            <li className="px-6 py-4 text-center text-sm text-text-muted">Todavía no hay puntos registrados.</li>
          )}
        </ul>
        <div className="px-6 pb-6" />
      </GlassCard>

      <Link href={`/tournaments/${tournamentId}`} className="text-sm text-gold-start hover:underline">
        ← Volver al torneo
      </Link>
    </div>
  );
}

function NavTile({
  href,
  icon,
  title,
  subtitle,
  external,
}: {
  href: string;
  icon: string;
  title: string;
  subtitle: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      className="flex items-start gap-3 rounded-2xl border border-border-glass bg-bg-glass p-4 transition hover:border-gold-start/50 hover:bg-white/5"
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-semibold text-text-primary">{title}</p>
        <p className="text-sm text-text-muted">{subtitle}</p>
      </div>
    </Link>
  );
}

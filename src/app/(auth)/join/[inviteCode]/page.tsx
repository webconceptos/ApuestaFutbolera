import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { JoinPoolButton } from "./join-pool-button";

export default async function JoinPoolPage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;
  const session = await auth();

  const pool = await db.pool.findUnique({
    where: { inviteCode },
    include: { tournament: true, _count: { select: { members: true } } },
  });

  if (!pool || !pool.isActive) {
    return (
      <GlassCard className="mx-auto max-w-lg text-center">
        <h1 className="font-display text-2xl tracking-wide text-text-primary">Invitación inválida</h1>
        <p className="mt-2 text-text-muted">Este código de invitación no existe o ya no es válido.</p>
      </GlassCard>
    );
  }

  const membership = session?.user
    ? await db.poolMember.findUnique({ where: { poolId_userId: { poolId: pool.id, userId: session.user.id } } })
    : null;

  if (membership?.isActive) {
    return (
      <GlassCard className="mx-auto max-w-lg text-center">
        <h1 className="font-display text-2xl tracking-wide text-text-primary">Ya eres parte de {pool.name}</h1>
        <Link
          href={`/tournaments/${pool.tournamentId}/pools/${pool.id}`}
          className="mt-2 inline-block text-gold-start hover:underline"
        >
          Ir a la polla →
        </Link>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="mx-auto flex max-w-lg flex-col items-center gap-3 text-center">
      <h1 className="font-display text-2xl tracking-wide text-text-primary">Te invitaron a {pool.name}</h1>
      <p className="text-text-muted">
        {pool.tournament.shortName} · {pool._count.members} participantes
      </p>
      {pool.description && <p className="text-sm text-text-muted">{pool.description}</p>}
      <JoinPoolButton
        poolId={pool.id}
        inviteCode={inviteCode}
        tournamentId={pool.tournamentId}
        isAuthenticated={!!session?.user}
      />
      {!session?.user && (
        <p className="text-sm text-text-muted">
          ¿Ya tienes cuenta?{" "}
          <Link href={`/login?callbackUrl=/join/${inviteCode}`} className="text-gold-start hover:underline">
            Inicia sesión
          </Link>
        </p>
      )}
    </GlassCard>
  );
}

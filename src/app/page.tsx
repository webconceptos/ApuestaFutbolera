import Link from "next/link";
import { redirect } from "next/navigation";
import { isSetupComplete } from "@/lib/setup";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLimaDayRange } from "@/lib/date-peru";
import { ParticleBackground } from "@/components/effects/particle-background";
import { GlassCard } from "@/components/ui/glass-card";
import { MatchPreviewRow } from "@/components/public/match-preview-row";

// Pública: un visitante sin sesión puede ver todo este contenido. Sí
// consultamos la sesión (a diferencia de /p/*, que evita auth() a propósito
// para poder cachear con "use cache") únicamente para decidir si mostrar el
// botón "Crear mi polla" — crear pollas es solo para administradores.
export default async function Home() {
  if (!(await isSetupComplete())) {
    redirect("/setup");
  }

  const session = await auth();
  const canCreatePool = session?.user.role === "SUPERADMIN" || session?.user.role === "TOURNAMENT_MANAGER";

  const tournaments = await db.tournament.findMany({
    where: { isActive: true, isPublic: true },
    orderBy: { startDate: "desc" },
    include: { _count: { select: { pools: { where: { isPublic: true, isActive: true } } } } },
  });

  const activeTournamentIds = tournaments.map((t) => t.id);
  const showTournamentLabel = tournaments.length > 1;

  // Vista estilo "casa de apuestas": dos tarjetas separadas por día calendario
  // en hora de Lima (no por torneo), una con los partidos de hoy y otra con
  // los de mañana — más fácil de leer de un vistazo que mezclar estados.
  const today = getLimaDayRange(0);
  const tomorrow = getLimaDayRange(1);

  const [todayMatchesRaw, tomorrowMatchesRaw] = activeTournamentIds.length
    ? await Promise.all([
        db.match.findMany({
          where: { tournamentId: { in: activeTournamentIds }, matchDate: { gte: today.start, lt: today.end } },
          orderBy: { matchDate: "asc" },
          include: { tournament: { select: { shortName: true } } },
        }),
        db.match.findMany({
          where: { tournamentId: { in: activeTournamentIds }, matchDate: { gte: tomorrow.start, lt: tomorrow.end } },
          orderBy: { matchDate: "asc" },
          include: { tournament: { select: { shortName: true } } },
        }),
      ])
    : [[], []];

  return (
    <main className="relative flex min-h-screen flex-col items-center gap-10 p-6 sm:p-10">
      <ParticleBackground />

      <div className="flex flex-col items-center gap-4 pb-2 pt-12 text-center">
        <div className="gradient-animated rounded-2xl px-8 py-3">
          <h1 className="font-display text-5xl tracking-wide text-white">Golazo Mundial</h1>
        </div>
        <p className="max-w-xl text-text-muted">Predice, compite y celebra cada partido con tu grupo.</p>
        <div className="flex gap-3 pt-2">
          <Link
            href="/login"
            className="rounded-lg border border-border-glass bg-bg-glass px-4 py-2 text-sm font-semibold text-text-primary hover:bg-white/10"
          >
            Iniciar sesión
          </Link>
          <Link href="/register" className="gradient-animated rounded-lg px-4 py-2 text-sm font-semibold text-white">
            Crear cuenta
          </Link>
        </div>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
        <GlassCard accentColor="#F59E0B" className="flex flex-col gap-2">
          <h2 className="font-display text-xl tracking-wide text-text-primary">⚽ Partidos de hoy</h2>
          {todayMatchesRaw.length === 0 ? (
            <p className="text-sm text-text-muted">No hay partidos programados para hoy.</p>
          ) : (
            todayMatchesRaw.map((m) => (
              <MatchPreviewRow
                key={m.id}
                match={m}
                showDate={false}
                tournamentLabel={showTournamentLabel ? m.tournament.shortName : undefined}
              />
            ))
          )}
        </GlassCard>

        <GlassCard accentColor="#F59E0B" className="flex flex-col gap-2">
          <h2 className="font-display text-xl tracking-wide text-text-primary">📅 Partidos de mañana</h2>
          {tomorrowMatchesRaw.length === 0 ? (
            <p className="text-sm text-text-muted">No hay partidos programados para mañana.</p>
          ) : (
            tomorrowMatchesRaw.map((m) => (
              <MatchPreviewRow
                key={m.id}
                match={m}
                showDate={false}
                tournamentLabel={showTournamentLabel ? m.tournament.shortName : undefined}
              />
            ))
          )}
        </GlassCard>
      </div>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((t) => (
          <GlassCard key={t.id} className="flex flex-col gap-3" accentColor="#F59E0B">
            <div className="flex items-center gap-3">
              {t.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.logo} alt={t.shortName} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-start/20 text-2xl">
                  🏆
                </span>
              )}
              <div>
                <h2 className="font-display text-xl tracking-wide text-text-primary">{t.shortName}</h2>
                <p className="text-xs text-text-muted">
                  {t.startDate.toLocaleDateString("es-PE")} – {t.endDate.toLocaleDateString("es-PE")}
                </p>
              </div>
            </div>

            <p className="text-sm text-text-muted">
              {t._count.pools} {t._count.pools === 1 ? "polla pública" : "pollas públicas"}
            </p>

            <div className="mt-auto flex gap-2 pt-2">
              <Link
                href={`/tournaments/${t.id}`}
                className="flex-1 rounded-lg bg-gold-start px-3 py-2 text-center text-sm font-semibold text-white hover:bg-gold-start/90"
              >
                Ver pollas
              </Link>
              {canCreatePool && (
                <Link
                  href={`/tournaments/${t.id}/pools/new`}
                  className="flex-1 rounded-lg border border-border-glass px-3 py-2 text-center text-sm font-semibold text-text-primary hover:bg-white/10"
                >
                  Crear mi polla
                </Link>
              )}
            </div>
          </GlassCard>
        ))}

        {tournaments.length === 0 && (
          <p className="col-span-full text-center text-text-muted">No hay torneos disponibles todavía.</p>
        )}
      </div>
    </main>
  );
}

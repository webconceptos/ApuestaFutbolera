import Link from "next/link";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";

export default async function TournamentsPage() {
  const tournaments = await db.tournament.findMany({
    where: { isActive: true, isPublic: true },
    orderBy: { startDate: "desc" },
    include: { _count: { select: { pools: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl tracking-wide text-text-primary">Torneos</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((t) => (
          <Link key={t.id} href={`/tournaments/${t.id}`}>
            <GlassCard className="flex h-full flex-col gap-2 transition-colors hover:bg-white/10">
              <h2 className="font-display text-2xl tracking-wide text-text-primary">{t.shortName}</h2>
              <p className="text-sm text-text-muted">{t.name}</p>
              <p className="mt-auto text-xs text-text-muted">
                {t.startDate.toLocaleDateString("es-PE")} – {t.endDate.toLocaleDateString("es-PE")} ·{" "}
                {t._count.pools} {t._count.pools === 1 ? "polla" : "pollas"}
              </p>
            </GlassCard>
          </Link>
        ))}

        {tournaments.length === 0 && <p className="text-text-muted">No hay torneos disponibles todavía.</p>}
      </div>
    </div>
  );
}

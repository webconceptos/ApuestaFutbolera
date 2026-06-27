import Link from "next/link";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { buttonClass } from "@/components/ui/form-styles";
import { TournamentRowActions } from "./tournament-row-actions";

export default async function TournamentsListPage() {
  const tournaments = await db.tournament.findMany({
    orderBy: { startDate: "desc" },
    include: { _count: { select: { matches: true, pools: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-wide text-text-primary">Torneos</h1>
        <Link href="/superadmin/tournaments/new" className={buttonClass}>
          + Nuevo torneo
        </Link>
      </div>

      <GlassCard className="overflow-x-auto p-0">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-border-glass text-text-muted">
              <th className="px-4 py-3 font-medium">Torneo</th>
              <th className="px-4 py-3 font-medium">Temporada</th>
              <th className="px-4 py-3 font-medium">Fechas</th>
              <th className="px-4 py-3 font-medium">Partidos</th>
              <th className="px-4 py-3 font-medium">Pollas</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {tournaments.map((t) => (
              <tr key={t.id} className="border-b border-border-glass last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/superadmin/tournaments/${t.id}`} className="font-medium text-text-primary hover:underline">
                    {t.shortName}
                  </Link>
                  <p className="text-xs text-text-muted">{t.name}</p>
                </td>
                <td className="px-4 py-3 text-text-muted">{t.season}</td>
                <td className="px-4 py-3 text-text-muted">
                  {t.startDate.toLocaleDateString("es-PE")} – {t.endDate.toLocaleDateString("es-PE")}
                </td>
                <td className="px-4 py-3 text-text-muted">{t._count.matches}</td>
                <td className="px-4 py-3 text-text-muted">{t._count.pools}</td>
                <td className="px-4 py-3">
                  <TournamentRowActions
                    id={t.id}
                    isActive={t.isActive}
                    isPublic={t.isPublic}
                    canDelete={t._count.matches === 0 && t._count.pools === 0}
                  />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/superadmin/tournaments/${t.id}`} className="text-gold-start hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}

            {tournaments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-text-muted">
                  Aún no hay torneos. Crea el primero.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}

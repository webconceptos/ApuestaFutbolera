"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClientDate } from "@/components/ui/client-date";
import { getLimaDateKey, formatDayLabel } from "@/lib/date-peru";
import { cn } from "@/lib/utils";

interface MatchRow {
  id: string;
  matchNumber: number;
  phase: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homeScore: number | null;
  awayScore: number | null;
  matchDate: string;
  status: string;
  predictionCount: number;
}

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: "Próximo",
  LIVE: "En vivo",
  FINISHED: "Finalizado",
  CANCELLED: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: "text-text-muted",
  LIVE: "text-error",
  FINISHED: "text-success",
  CANCELLED: "text-text-muted line-through",
};

export function MatchList({ tournamentId, matches }: { tournamentId: string; matches: MatchRow[] }) {
  const router = useRouter();
  const [phaseFilter, setPhaseFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const phases = useMemo(() => Array.from(new Set(matches.map((m) => m.phase))), [matches]);
  // Días en hora de Lima (no UTC), para que coincida con la fecha que el
  // superadmin espera ver/escribir, igual que el resto del sitio.
  const dateKeys = useMemo(() => {
    const keys = Array.from(new Set(matches.map((m) => getLimaDateKey(m.matchDate))));
    return keys.sort();
  }, [matches]);

  const filtered = matches.filter(
    (m) =>
      (phaseFilter === "ALL" || m.phase === phaseFilter) &&
      (statusFilter === "ALL" || m.status === statusFilter) &&
      (dateFilter === "ALL" || getLimaDateKey(m.matchDate) === dateFilter)
  );

  async function handleDelete(matchId: string) {
    if (!confirm("¿Eliminar este partido?")) return;
    setDeletingId(matchId);
    try {
      const res = await fetch(`/api/superadmin/tournaments/${tournamentId}/matches/${matchId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error ?? "No se pudo eliminar");
        return;
      }
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <select
          value={phaseFilter}
          onChange={(e) => setPhaseFilter(e.target.value)}
          className="rounded-lg border border-border-glass bg-bg-glass px-3 py-2 text-sm text-text-primary"
        >
          <option value="ALL">Todas las fases</option>
          {phases.map((phase) => (
            <option key={phase} value={phase}>
              {phase}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border-glass bg-bg-glass px-3 py-2 text-sm text-text-primary"
        >
          <option value="ALL">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-lg border border-border-glass bg-bg-glass px-3 py-2 text-sm text-text-primary"
        >
          <option value="ALL">Todas las fechas</option>
          {dateKeys.map((key) => (
            <option key={key} value={key}>
              {formatDayLabel(key)}
            </option>
          ))}
        </select>

        <span className="self-center text-sm text-text-muted">
          {filtered.length} de {matches.length} partidos
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-border-glass text-text-muted">
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Fase</th>
              <th className="px-3 py-2 font-medium">Partido</th>
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Resultado</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-border-glass last:border-0">
                <td className="px-3 py-2 text-text-muted">{m.matchNumber}</td>
                <td className="px-3 py-2 text-text-muted">{m.phase}</td>
                <td className="px-3 py-2 text-text-primary">
                  {m.homeFlag} {m.homeTeam} vs {m.awayTeam} {m.awayFlag}
                </td>
                <td className="px-3 py-2 text-text-muted">
                  <ClientDate iso={m.matchDate} options={{ dateStyle: "short", timeStyle: "short" }} />
                </td>
                <td className="px-3 py-2 font-mono text-text-primary">
                  {m.homeScore !== null && m.awayScore !== null ? `${m.homeScore}-${m.awayScore}` : "—"}
                </td>
                <td className={cn("px-3 py-2", STATUS_COLORS[m.status])}>{STATUS_LABELS[m.status]}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    <Link href={`/superadmin/tournaments/${tournamentId}/matches/${m.id}`} className="text-gold-start hover:underline">
                      {m.homeScore === null ? "Ingresar resultado" : "Editar"}
                    </Link>
                    {m.predictionCount === 0 && (
                      <button
                        type="button"
                        disabled={deletingId === m.id}
                        onClick={() => handleDelete(m.id)}
                        className="text-error hover:underline disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-text-muted">
                  Sin partidos para este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

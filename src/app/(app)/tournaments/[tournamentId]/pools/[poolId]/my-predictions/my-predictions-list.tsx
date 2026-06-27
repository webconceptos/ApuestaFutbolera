"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { ClientDate } from "@/components/ui/client-date";

type Status = "sin_apostar" | "pendiente" | "acertado" | "fallado";

interface PredictionRow {
  matchId: string;
  phase: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  matchDate: string;
  homeScore: number | null;
  awayScore: number | null;
  predictedHome: number | null;
  predictedAway: number | null;
  resultType: string | null;
  pointsEarned: number | null;
  status: Status;
}

interface Summary {
  totalPoints: number;
  exactScores: number;
  accuracy: number | null;
}

const STATUS_LABEL: Record<Status, string> = {
  sin_apostar: "Sin apostar",
  pendiente: "Pendiente",
  acertado: "Acertado",
  fallado: "Fallado",
};

const STATUS_COLOR: Record<Status, string> = {
  sin_apostar: "text-text-muted",
  pendiente: "text-warning",
  acertado: "text-success",
  fallado: "text-error",
};

const RESULT_TYPE_LABEL: Record<string, string> = {
  EXACT_SCORE: "🏆 Marcador exacto",
  CORRECT_DIFF: "✅ Diferencia correcta",
  CORRECT_RESULT: "✅ Resultado correcto",
  NONE: "❌ Sin acierto",
};

const STATUS_FILTERS: { value: Status | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "acertado", label: "Acertados" },
  { value: "fallado", label: "Fallados" },
  { value: "pendiente", label: "Pendientes" },
  { value: "sin_apostar", label: "Sin apostar" },
];

export function MyPredictionsList({ rows, summary }: { rows: PredictionRow[]; summary: Summary }) {
  const phases = useMemo(() => Array.from(new Set(rows.map((r) => r.phase))), [rows]);
  const [activePhase, setActivePhase] = useState<string>("todas");
  const [activeStatus, setActiveStatus] = useState<Status | "todos">("todos");

  const visible = rows.filter(
    (r) => (activePhase === "todas" || r.phase === activePhase) && (activeStatus === "todos" || r.status === activeStatus)
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
        <GlassCard className="text-center">
          <p className="text-xs text-text-muted">Puntos totales</p>
          <p className="font-mono text-2xl text-gold-start">{summary.totalPoints}</p>
        </GlassCard>
        <GlassCard className="text-center">
          <p className="text-xs text-text-muted">Marcadores exactos</p>
          <p className="font-mono text-2xl text-text-primary">{summary.exactScores}</p>
        </GlassCard>
        <GlassCard className="text-center">
          <p className="text-xs text-text-muted">% de aciertos</p>
          <p className="font-mono text-2xl text-text-primary">{summary.accuracy === null ? "—" : `${summary.accuracy}%`}</p>
        </GlassCard>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActivePhase("todas")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            activePhase === "todas" ? "bg-white/10 text-text-primary" : "text-text-muted hover:bg-white/5"
          }`}
        >
          Todas las fases
        </button>
        {phases.map((phase) => (
          <button
            key={phase}
            type="button"
            onClick={() => setActivePhase(phase)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              activePhase === phase ? "bg-white/10 text-text-primary" : "text-text-muted hover:bg-white/5"
            }`}
          >
            {phase}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setActiveStatus(f.value)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              activeStatus === f.value ? "bg-white/10 text-text-primary" : "text-text-muted hover:bg-white/5"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <GlassCard className="p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border-glass text-text-muted">
              <th className="px-4 py-2 font-medium">Partido</th>
              <th className="px-4 py-2 font-medium">Mi apuesta</th>
              <th className="px-4 py-2 font-medium">Resultado</th>
              <th className="px-4 py-2 font-medium">Tipo</th>
              <th className="px-4 py-2 font-medium">Pts</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.matchId} className="border-b border-border-glass last:border-0">
                <td className="px-4 py-2 text-text-primary">
                  <p>
                    {r.homeFlag} {r.homeTeam} vs {r.awayTeam} {r.awayFlag}
                  </p>
                  <p className="text-xs text-text-muted">
                    <ClientDate iso={r.matchDate} /> · {r.phase}
                  </p>
                  <p className={`text-xs ${STATUS_COLOR[r.status]}`}>{STATUS_LABEL[r.status]}</p>
                </td>
                <td className="px-4 py-2 font-mono text-text-primary">
                  {r.predictedHome !== null ? `${r.predictedHome}-${r.predictedAway}` : "—"}
                </td>
                <td className="px-4 py-2 font-mono text-text-muted">
                  {r.homeScore !== null ? `${r.homeScore}-${r.awayScore}` : "—"}
                </td>
                <td className="px-4 py-2 text-text-muted">
                  {r.resultType && r.status !== "pendiente" && r.status !== "sin_apostar"
                    ? RESULT_TYPE_LABEL[r.resultType]
                    : "—"}
                </td>
                <td className="px-4 py-2 font-mono text-text-primary">
                  {r.status === "acertado" || r.status === "fallado" ? r.pointsEarned : "—"}
                </td>
              </tr>
            ))}

            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-text-muted">
                  No hay partidos que coincidan con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}

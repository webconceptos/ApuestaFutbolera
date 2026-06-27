"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { getLimaDateKey, formatDayLabel } from "@/lib/date-peru";
import { MatchPredictionRow } from "./match-prediction-row";

interface MatchWithPrediction {
  id: string;
  phase: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  matchDate: string;
  deadlineIso: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  isOpen: boolean;
  existing: { homeScore: number; awayScore: number } | null;
}

type ViewMode = "day" | "phase";

export function PredictionsList({
  poolId,
  matches,
  canPredict,
}: {
  poolId: string;
  matches: MatchWithPrediction[];
  canPredict: boolean;
}) {
  // "Por día" por defecto: con 12 grupos + fases eliminatorias, navegar por
  // fase es mucha pestaña para encontrar "qué tengo que apostar hoy". Se deja
  // "Por fase" como alternativa para quien prefiera ese orden.
  const [viewMode, setViewMode] = useState<ViewMode>("day");

  const phases = useMemo(() => Array.from(new Set(matches.map((m) => m.phase))), [matches]);
  const [activePhase, setActivePhase] = useState(phases[0] ?? "");

  const dayKeys = useMemo(() => {
    const keys = Array.from(new Set(matches.map((m) => getLimaDateKey(m.matchDate))));
    return keys.sort();
  }, [matches]);
  // Arranca en "hoy" (o el próximo día con partidos, si hoy no tiene) en vez
  // del primer día del fixture completo — es lo que alguien que entra a
  // apostar quiere ver primero, no el arranque del torneo hace dos semanas.
  const [activeDay, setActiveDay] = useState(() => {
    const todayKey = getLimaDateKey(new Date());
    return dayKeys.find((k) => k >= todayKey) ?? dayKeys[dayKeys.length - 1] ?? "";
  });

  const visible =
    viewMode === "phase"
      ? matches.filter((m) => m.phase === activePhase)
      : matches.filter((m) => getLimaDateKey(m.matchDate) === activeDay);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 rounded-lg bg-bg-glass p-1 text-sm">
        <button
          type="button"
          onClick={() => setViewMode("day")}
          className={`flex-1 rounded-md px-3 py-1.5 ${
            viewMode === "day" ? "bg-gold-start font-semibold text-white" : "text-text-muted hover:bg-white/5"
          }`}
        >
          Por día
        </button>
        <button
          type="button"
          onClick={() => setViewMode("phase")}
          className={`flex-1 rounded-md px-3 py-1.5 ${
            viewMode === "phase" ? "bg-gold-start font-semibold text-white" : "text-text-muted hover:bg-white/5"
          }`}
        >
          Por fase
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {viewMode === "day"
          ? dayKeys.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveDay(key)}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  activeDay === key ? "bg-white/10 text-text-primary" : "text-text-muted hover:bg-white/5"
                }`}
              >
                {formatDayLabel(key)}
              </button>
            ))
          : phases.map((phase) => (
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

      <GlassCard>
        {visible.map((m) => (
          <MatchPredictionRow
            key={m.id}
            poolId={poolId}
            matchId={m.id}
            homeTeam={m.homeTeam}
            awayTeam={m.awayTeam}
            homeFlag={m.homeFlag}
            awayFlag={m.awayFlag}
            matchDate={m.matchDate}
            deadlineIso={m.deadlineIso}
            status={m.status}
            homeScore={m.homeScore}
            awayScore={m.awayScore}
            isOpen={m.isOpen}
            canPredict={canPredict}
            existing={m.existing}
            phaseLabel={viewMode === "day" ? m.phase : undefined}
          />
        ))}

        {visible.length === 0 && (
          <p className="py-4 text-center text-text-muted">
            {viewMode === "day" ? "Sin partidos este día." : "Sin partidos en esta fase."}
          </p>
        )}
      </GlassCard>
    </div>
  );
}

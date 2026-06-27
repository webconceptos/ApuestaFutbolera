"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { ClientDate } from "@/components/ui/client-date";
import { getLimaDateKey, formatDayLabel } from "@/lib/date-peru";

interface Pick {
  userId: string;
  name: string;
  hasPredicted: boolean;
  prediction: { homeScore: number; awayScore: number; pointsEarned: number; resultType: string; isScored: boolean } | null;
}

interface MatchData {
  id: string;
  phase: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  matchDate: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  revealScores: boolean;
  picks: Pick[];
}

type ViewMode = "day" | "phase";

const RESULT_STYLE: Record<string, string> = {
  EXACT_SCORE: "text-gold-start",
  CORRECT_DIFF: "text-success",
  CORRECT_RESULT: "text-info",
  NONE: "text-text-muted",
};

export function AllPredictionsView({ matches }: { matches: MatchData[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>("day");

  const phases = useMemo(() => Array.from(new Set(matches.map((m) => m.phase))), [matches]);
  const [activePhase, setActivePhase] = useState(phases[0] ?? "");

  const dayKeys = useMemo(() => {
    const keys = Array.from(new Set(matches.map((m) => getLimaDateKey(m.matchDate))));
    return keys.sort();
  }, [matches]);
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

      {visible.length === 0 && (
        <GlassCard>
          <p className="py-4 text-center text-text-muted">
            {viewMode === "day" ? "Sin partidos este día." : "Sin partidos en esta fase."}
          </p>
        </GlassCard>
      )}

      {visible.map((m) => {
        const predicted = m.picks.filter((p) => p.hasPredicted).length;
        return (
          <GlassCard key={m.id} className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-glass px-5 py-3">
              <div>
                <p className="text-text-primary">
                  {m.homeFlag} {m.homeTeam} <span className="text-text-muted">vs</span> {m.awayTeam} {m.awayFlag}
                </p>
                <p className="text-xs text-text-muted">
                  {viewMode === "day" && <span className="mr-1 rounded bg-bg-glass px-1.5 py-0.5">{m.phase}</span>}
                  <ClientDate iso={m.matchDate} options={{ dateStyle: "short", timeStyle: "short" }} />
                  {m.status === "FINISHED" && (
                    <span className="ml-2 font-mono text-text-primary">
                      Resultado: {m.homeScore}-{m.awayScore}
                    </span>
                  )}
                </p>
              </div>
              <span className="rounded-full bg-bg-glass px-3 py-1 text-xs text-text-muted">
                {predicted}/{m.picks.length} apostaron
              </span>
            </div>

            <ul className="divide-y divide-border-glass">
              {m.picks.map((p) => (
                <li key={p.userId} className="flex items-center justify-between px-5 py-2 text-sm">
                  <span className="text-text-primary">{p.name}</span>
                  {p.prediction ? (
                    <span className="flex items-center gap-2 font-mono">
                      <span className="text-text-primary">
                        {p.prediction.homeScore}-{p.prediction.awayScore}
                      </span>
                      {p.prediction.isScored && (
                        <span className={`text-xs ${RESULT_STYLE[p.prediction.resultType] ?? "text-text-muted"}`}>
                          +{p.prediction.pointsEarned} pts
                        </span>
                      )}
                    </span>
                  ) : p.hasPredicted ? (
                    <span className="text-xs text-text-muted">🔒 Apostó (se revela al cerrar)</span>
                  ) : (
                    <span className="text-xs text-warning">✗ Sin apostar</span>
                  )}
                </li>
              ))}
            </ul>
          </GlassCard>
        );
      })}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClientDate } from "@/components/ui/client-date";
import { Countdown } from "@/components/ui/countdown";
import { errorClass } from "@/components/ui/form-styles";

interface MatchPredictionRowProps {
  poolId: string;
  matchId: string;
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
  canPredict: boolean;
  existing: { homeScore: number; awayScore: number } | null;
  /** Solo se muestra en la vista agrupada "Por día", donde se mezclan partidos de distintas fases/grupos. */
  phaseLabel?: string;
}

export function MatchPredictionRow({
  poolId,
  matchId,
  homeTeam,
  awayTeam,
  homeFlag,
  awayFlag,
  matchDate,
  deadlineIso,
  status,
  homeScore,
  awayScore,
  isOpen,
  canPredict,
  existing,
  phaseLabel,
}: MatchPredictionRowProps) {
  const router = useRouter();
  const [home, setHome] = useState(existing?.homeScore ?? 0);
  const [away, setAway] = useState(existing?.awayScore ?? 0);
  const [editing, setEditing] = useState(!existing);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/pools/${poolId}/predictions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, homeScore: home, awayScore: away }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo guardar la predicción");
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 border-b border-border-glass py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-1">
        <p className="text-text-primary">
          {homeFlag} {homeTeam} <span className="text-text-muted">vs</span> {awayTeam} {awayFlag}
        </p>
        <p className="text-xs text-text-muted">
          {phaseLabel && <span className="mr-1 rounded bg-bg-glass px-1.5 py-0.5">{phaseLabel}</span>}
          <ClientDate iso={matchDate} options={{ dateStyle: "short", timeStyle: "short" }} />
          {status === "UPCOMING" && (
            <>
              {" "}
              ·{" "}
              {isOpen ? (
                <>
                  cierra en <Countdown deadlineIso={deadlineIso} />
                </>
              ) : (
                <span className="text-error">🔒 Apuestas cerradas</span>
              )}
            </>
          )}
        </p>
      </div>

      {status === "FINISHED" && (
        <div className="text-sm">
          <p className="font-mono text-text-primary">
            Resultado: {homeScore}-{awayScore}
          </p>
          {existing && (
            <p className="text-text-muted">
              Tu apuesta: {existing.homeScore}-{existing.awayScore}
            </p>
          )}
        </div>
      )}

      {status !== "FINISHED" && !canPredict && (
        <p className="text-xs text-warning">Cuota pendiente: no puedes apostar todavía</p>
      )}

      {status === "UPCOMING" && canPredict && isOpen && !editing && existing && (
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-success/20 px-3 py-1 text-sm text-success">
            ✓ Apostaste: {existing.homeScore}-{existing.awayScore}
          </span>
          <button type="button" onClick={() => setEditing(true)} className="text-xs text-gold-start hover:underline">
            Editar
          </button>
        </div>
      )}

      {status === "UPCOMING" && canPredict && isOpen && editing && (
        <div className="flex items-center gap-2">
          <Stepper value={home} onChange={setHome} />
          <span className="text-text-muted">-</span>
          <Stepper value={away} onChange={setAway} />
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="rounded-lg bg-gold-start px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "..." : existing ? "Actualizar" : "Apostar"}
          </button>
          {error && <p className={errorClass}>{error}</p>}
        </div>
      )}

      {status === "UPCOMING" && !isOpen && (
        <span className="text-sm text-text-muted">
          {existing ? `🔒 Apostaste: ${existing.homeScore}-${existing.awayScore}` : "🔒 No apostaste"}
        </span>
      )}
    </div>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="h-7 w-7 rounded bg-bg-glass text-text-primary hover:bg-white/10"
      >
        −
      </button>
      <span className="w-6 text-center font-mono text-text-primary">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(20, value + 1))}
        className="h-7 w-7 rounded bg-bg-glass text-text-primary hover:bg-white/10"
      >
        +
      </button>
    </div>
  );
}

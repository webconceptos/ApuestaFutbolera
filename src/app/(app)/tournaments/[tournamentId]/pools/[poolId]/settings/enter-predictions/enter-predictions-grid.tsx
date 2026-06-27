"use client";

import { useState, useCallback } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { useSettingsSubmit } from "@/hooks/use-settings-submit";

interface Member {
  userId: string;
  name: string;
}

interface ExistingPrediction {
  homeScore: number;
  awayScore: number;
  isScored: boolean;
}

interface MatchData {
  id: string;
  phase: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  matchDate: string;
  homeScore: number | null;
  awayScore: number | null;
  existingPredictions: Record<string, ExistingPrediction>;
}

interface Props {
  poolId: string;
  matches: MatchData[];
  members: Member[];
}

type ScoreInput = { home: string; away: string };
type SaveState = "idle" | "loading" | "success" | "error";

// Estado compartido: scores[matchId][userId] = { home, away }
function buildInitialScores(matches: MatchData[], members: Member[]) {
  const initial: Record<string, Record<string, ScoreInput>> = {};
  for (const match of matches) {
    initial[match.id] = {};
    for (const member of members) {
      const existing = match.existingPredictions[member.userId];
      initial[match.id][member.userId] = {
        home: existing !== undefined ? String(existing.homeScore) : "",
        away: existing !== undefined ? String(existing.awayScore) : "",
      };
    }
  }
  return initial;
}

const inputCls =
  "w-14 rounded-md border border-border-glass bg-white/5 px-1 py-1.5 text-center text-text-primary focus:border-amber-400 focus:outline-none";

function formatMatchDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Lima",
  });
}

export function EnterPredictionsGrid({ poolId, matches, members }: Props) {
  const [mode, setMode] = useState<"match" | "member">("match");
  const [scores, setScores] = useState<Record<string, Record<string, ScoreInput>>>(
    () => buildInitialScores(matches, members)
  );
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const [saveMessages, setSaveMessages] = useState<Record<string, string>>({});
  const recalc = useSettingsSubmit(`/api/pools/${poolId}/recalculate-ranking`, "POST");

  const setScore = useCallback(
    (matchId: string, userId: string, field: "home" | "away", value: string) => {
      if (value !== "" && (!/^\d+$/.test(value) || parseInt(value, 10) > 20)) return;
      setScores((prev) => ({
        ...prev,
        [matchId]: { ...prev[matchId], [userId]: { ...prev[matchId]?.[userId], [field]: value } },
      }));
      // Limpiar feedback de guardado al editar
      const key = mode === "match" ? matchId : userId;
      setSaveStates((prev) => ({ ...prev, [key]: "idle" }));
    },
    [mode]
  );

  // ── Guardar por partido ───────────────────────────────────────────────────
  async function saveMatch(matchId: string) {
    const entries = Object.entries(scores[matchId] ?? {})
      .filter(([, s]) => s.home !== "" && s.away !== "")
      .map(([userId, s]) => ({ userId, homeScore: +s.home, awayScore: +s.away }));

    if (entries.length === 0) {
      setSaveStates((p) => ({ ...p, [matchId]: "error" }));
      setSaveMessages((p) => ({ ...p, [matchId]: "Ingresa al menos una predicción" }));
      return;
    }
    setSaveStates((p) => ({ ...p, [matchId]: "loading" }));
    try {
      const res = await fetch(`/api/pools/${poolId}/predictions/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, entries }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setSaveStates((p) => ({ ...p, [matchId]: "error" }));
        setSaveMessages((p) => ({ ...p, [matchId]: data?.error ?? "Error al guardar" }));
      } else {
        setSaveStates((p) => ({ ...p, [matchId]: "success" }));
        setSaveMessages((p) => ({
          ...p,
          [matchId]: `✓ ${data.saved} predicción${data.saved !== 1 ? "es" : ""} guardada${data.saved !== 1 ? "s" : ""}`,
        }));
      }
    } catch {
      setSaveStates((p) => ({ ...p, [matchId]: "error" }));
      setSaveMessages((p) => ({ ...p, [matchId]: "Error de conexión" }));
    }
  }

  // ── Guardar por participante ──────────────────────────────────────────────
  async function saveMember(userId: string) {
    const entries = matches
      .map((m) => {
        const s = scores[m.id]?.[userId];
        if (!s || s.home === "" || s.away === "") return null;
        return { matchId: m.id, homeScore: +s.home, awayScore: +s.away };
      })
      .filter(Boolean) as { matchId: string; homeScore: number; awayScore: number }[];

    if (entries.length === 0) {
      setSaveStates((p) => ({ ...p, [userId]: "error" }));
      setSaveMessages((p) => ({ ...p, [userId]: "Ingresa al menos una predicción" }));
      return;
    }
    setSaveStates((p) => ({ ...p, [userId]: "loading" }));
    try {
      const res = await fetch(`/api/pools/${poolId}/predictions/admin-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, entries }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setSaveStates((p) => ({ ...p, [userId]: "error" }));
        setSaveMessages((p) => ({ ...p, [userId]: data?.error ?? "Error al guardar" }));
      } else {
        setSaveStates((p) => ({ ...p, [userId]: "success" }));
        setSaveMessages((p) => ({
          ...p,
          [userId]: `✓ ${data.saved} predicción${data.saved !== 1 ? "es" : ""} guardada${data.saved !== 1 ? "s" : ""}`,
        }));
      }
    } catch {
      setSaveStates((p) => ({ ...p, [userId]: "error" }));
      setSaveMessages((p) => ({ ...p, [userId]: "Error de conexión" }));
    }
  }

  // ── Helpers de conteo ─────────────────────────────────────────────────────
  const filledForMatch = (matchId: string) =>
    Object.values(scores[matchId] ?? {}).filter((s) => s.home !== "" && s.away !== "").length;

  const filledForMember = (userId: string) =>
    matches.filter((m) => {
      const s = scores[m.id]?.[userId];
      return s && s.home !== "" && s.away !== "";
    }).length;

  // ── Barra superior compartida ─────────────────────────────────────────────
  const TopBar = (
    <div className="flex flex-col gap-3">
      {/* Toggle de modo */}
      <div className="flex items-center gap-1 rounded-xl border border-border-glass bg-white/5 p-1 self-start">
        <button
          type="button"
          onClick={() => setMode("match")}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === "match" ? "bg-white/15 text-text-primary" : "text-text-muted hover:text-text-primary"
          }`}
        >
          Por partido
        </button>
        <button
          type="button"
          onClick={() => setMode("member")}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === "member" ? "bg-white/15 text-text-primary" : "text-text-muted hover:text-text-primary"
          }`}
        >
          Por participante
        </button>
      </div>

      {/* Recalcular */}
      <div className="flex flex-col gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary">Paso final: después de guardar todo</p>
          <p className="text-xs text-text-muted">
            Recalcula puntos y posiciones de todos los miembros según las predicciones ingresadas
          </p>
        </div>
        <button
          type="button"
          onClick={() => recalc.submit({})}
          disabled={recalc.loading}
          className="shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-amber-400 disabled:opacity-50"
        >
          {recalc.loading ? "Recalculando..." : "🔄 Recalcular ranking"}
        </button>
      </div>
      {recalc.success && (
        <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-400">
          ✓ Ranking recalculado. Revisa el ranking de la polla para ver las posiciones actualizadas.
        </p>
      )}
      {recalc.error && <p className="text-sm text-red-400">{recalc.error}</p>}

      {matches.length === 0 && (
        <div className="rounded-xl border border-border-glass bg-white/5 px-6 py-8 text-center text-sm text-text-muted">
          No hay partidos en la ventana de puntuación configurada.
          <br />
          Revisa Configuración → Puntuación para ajustar las fechas.
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // MODO: POR PARTIDO
  // ══════════════════════════════════════════════════════════════════════════
  if (mode === "match") {
    return (
      <div className="flex flex-col gap-4">
        {TopBar}
        {matches.map((match) => {
          const saveState = saveStates[match.id] ?? "idle";
          const saveMsg = saveMessages[match.id];
          const filled = filledForMatch(match.id);
          const hasResult = match.homeScore !== null && match.awayScore !== null;

          return (
            <GlassCard key={match.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-text-primary">
                    {match.homeFlag} {match.homeTeam} vs {match.awayTeam} {match.awayFlag}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {match.phase} · {formatMatchDate(match.matchDate)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {hasResult && (
                    <span className="rounded-md border border-green-500/30 bg-green-500/15 px-2 py-0.5 text-xs text-green-400">
                      Resultado: {match.homeScore}–{match.awayScore}
                    </span>
                  )}
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs border ${
                      filled === members.length && members.length > 0
                        ? "border-green-500/30 bg-green-500/15 text-green-400"
                        : "border-border-glass bg-white/5 text-text-muted"
                    }`}
                  >
                    {filled}/{members.length} ingresadas
                  </span>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-glass text-left text-xs text-text-muted">
                      <th className="pb-2 pr-4 font-medium">Participante</th>
                      <th className="pb-2 pr-1 text-center font-medium">{match.homeFlag} Local</th>
                      <th className="pb-2 pl-1 text-center font-medium">Visita {match.awayFlag}</th>
                      <th className="pb-2 pl-3 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => {
                      const s = scores[match.id]?.[member.userId] ?? { home: "", away: "" };
                      const existing = match.existingPredictions[member.userId];
                      const isFilled = s.home !== "" && s.away !== "";
                      return (
                        <tr key={member.userId} className="border-b border-border-glass/40 last:border-0">
                          <td className="py-2 pr-4 font-medium text-text-primary">{member.name}</td>
                          <td className="py-2 pr-1 text-center">
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              max={20}
                              value={s.home}
                              onChange={(e) => setScore(match.id, member.userId, "home", e.target.value)}
                              className={inputCls}
                              placeholder="–"
                            />
                          </td>
                          <td className="py-2 pl-1 text-center">
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              max={20}
                              value={s.away}
                              onChange={(e) => setScore(match.id, member.userId, "away", e.target.value)}
                              className={inputCls}
                              placeholder="–"
                            />
                          </td>
                          <td className="py-2 pl-3 text-xs">
                            {!isFilled && !existing && <span className="text-text-muted">Sin ingresar</span>}
                            {!isFilled && existing && (
                              <span className="text-amber-400">
                                Guardado: {existing.homeScore}-{existing.awayScore}
                                {existing.isScored && " ✓"}
                              </span>
                            )}
                            {isFilled && existing && (
                              <span className="text-amber-400">
                                Prev: {existing.homeScore}-{existing.awayScore}
                              </span>
                            )}
                            {isFilled && !existing && <span className="text-text-muted">Nuevo</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => saveMatch(match.id)}
                  disabled={saveState === "loading"}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-50"
                >
                  {saveState === "loading" ? "Guardando..." : "Guardar este partido"}
                </button>
                {saveState === "success" && <span className="text-sm text-green-400">{saveMsg}</span>}
                {saveState === "error" && <span className="text-sm text-red-400">{saveMsg}</span>}
              </div>
            </GlassCard>
          );
        })}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODO: POR PARTICIPANTE
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col gap-4">
      {TopBar}
      {members.map((member) => {
        const saveState = saveStates[member.userId] ?? "idle";
        const saveMsg = saveMessages[member.userId];
        const filled = filledForMember(member.userId);

        return (
          <GlassCard key={member.userId}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-text-primary">{member.name}</p>
                <p className="mt-0.5 text-xs text-text-muted">Predicciones del participante</p>
              </div>
              <span
                className={`rounded-md px-2 py-0.5 text-xs border ${
                  filled === matches.length && matches.length > 0
                    ? "border-green-500/30 bg-green-500/15 text-green-400"
                    : "border-border-glass bg-white/5 text-text-muted"
                }`}
              >
                {filled}/{matches.length} ingresadas
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-glass text-left text-xs text-text-muted">
                    <th className="pb-2 pr-4 font-medium">Partido</th>
                    <th className="pb-2 pr-1 text-center font-medium">Local</th>
                    <th className="pb-2 pl-1 text-center font-medium">Visita</th>
                    <th className="pb-2 pl-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match) => {
                    const s = scores[match.id]?.[member.userId] ?? { home: "", away: "" };
                    const existing = match.existingPredictions[member.userId];
                    const isFilled = s.home !== "" && s.away !== "";
                    const hasResult = match.homeScore !== null && match.awayScore !== null;

                    return (
                      <tr key={match.id} className="border-b border-border-glass/40 last:border-0">
                        <td className="py-2 pr-4">
                          <p className="font-medium text-text-primary">
                            {match.homeFlag} {match.homeTeam} vs {match.awayTeam} {match.awayFlag}
                          </p>
                          <p className="text-xs text-text-muted">{formatMatchDate(match.matchDate)}</p>
                          {hasResult && (
                            <p className="text-xs text-green-400">
                              Resultado: {match.homeScore}–{match.awayScore}
                            </p>
                          )}
                        </td>
                        <td className="py-2 pr-1 text-center">
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={20}
                            value={s.home}
                            onChange={(e) => setScore(match.id, member.userId, "home", e.target.value)}
                            className={inputCls}
                            placeholder="–"
                          />
                        </td>
                        <td className="py-2 pl-1 text-center">
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={20}
                            value={s.away}
                            onChange={(e) => setScore(match.id, member.userId, "away", e.target.value)}
                            className={inputCls}
                            placeholder="–"
                          />
                        </td>
                        <td className="py-2 pl-3 text-xs">
                          {!isFilled && !existing && <span className="text-text-muted">Sin ingresar</span>}
                          {!isFilled && existing && (
                            <span className="text-amber-400">
                              Guardado: {existing.homeScore}-{existing.awayScore}
                              {existing.isScored && " ✓"}
                            </span>
                          )}
                          {isFilled && existing && (
                            <span className="text-amber-400">
                              Prev: {existing.homeScore}-{existing.awayScore}
                            </span>
                          )}
                          {isFilled && !existing && <span className="text-text-muted">Nuevo</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => saveMember(member.userId)}
                disabled={saveState === "loading"}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-50"
              >
                {saveState === "loading" ? "Guardando..." : `Guardar ${member.name}`}
              </button>
              {saveState === "success" && <span className="text-sm text-green-400">{saveMsg}</span>}
              {saveState === "error" && <span className="text-sm text-red-400">{saveMsg}</span>}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";

interface PlayerPrediction {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  phase: string;
  homeScore: number;
  awayScore: number;
  predictedHome: number;
  predictedAway: number;
  pointsEarned: number;
  resultType: string;
}

interface PlayerProfileProps {
  poolSlug: string;
  poolName: string;
  accentColor: string;
  name: string;
  bio: string | null;
  rankPosition: number | null;
  totalPoints: number;
  exactScores: number;
  joinedAtLabel: string;
  showPredictions: boolean;
  predictions: PlayerPrediction[];
}

const RESULT_BADGE: Record<string, string> = {
  EXACT_SCORE: "🏆 Exacto",
  CORRECT_DIFF: "✅ Diferencia",
  CORRECT_RESULT: "✅ Resultado",
  NONE: "❌ Sin acierto",
};

export function PublicPlayerProfile({
  poolSlug,
  poolName,
  accentColor,
  name,
  bio,
  rankPosition,
  totalPoints,
  exactScores,
  joinedAtLabel,
  showPredictions,
  predictions,
}: PlayerProfileProps) {
  return (
    <>
      <GlassCard accentColor={accentColor} className="flex flex-col gap-3">
        <Link href={`/p/${poolSlug}`} className="text-sm text-text-muted hover:underline">
          ← {poolName}
        </Link>
        <div className="flex items-center gap-4">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-semibold text-white"
            style={{ backgroundColor: accentColor }}
          >
            {name.charAt(0).toUpperCase()}
          </span>
          <div>
            <h1 className="font-display text-3xl tracking-wide text-text-primary">{name}</h1>
            {bio && <p className="text-sm text-text-muted">{bio}</p>}
            <p className="text-xs text-text-muted">Miembro desde {joinedAtLabel}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="rounded-lg bg-bg-glass p-3 text-center">
            <p className="text-xs text-text-muted">Posición</p>
            <p className="font-mono text-2xl text-text-primary">{rankPosition ?? "—"}</p>
          </div>
          <div className="rounded-lg bg-bg-glass p-3 text-center">
            <p className="text-xs text-text-muted">Puntos</p>
            <p className="font-mono text-2xl text-text-primary">{totalPoints}</p>
          </div>
          <div className="rounded-lg bg-bg-glass p-3 text-center">
            <p className="text-xs text-text-muted">Exactos</p>
            <p className="font-mono text-2xl text-text-primary">{exactScores}</p>
          </div>
        </div>
      </GlassCard>

      {showPredictions && (
        <GlassCard className="flex flex-col gap-3">
          <h2 className="font-display text-2xl tracking-wide text-text-primary">⚽ Apuestas en partidos jugados</h2>

          {predictions.length === 0 && <p className="text-text-muted">Todavía no hay partidos jugados.</p>}

          {predictions.map((p) => (
            <div key={p.matchId} className="flex items-center justify-between border-b border-border-glass pb-2 last:border-0">
              <div>
                <p className="text-sm text-text-primary">
                  {p.homeFlag} {p.homeTeam} vs {p.awayTeam} {p.awayFlag}
                </p>
                <p className="text-xs text-text-muted">
                  Apostó {p.predictedHome}-{p.predictedAway} · resultado {p.homeScore}-{p.awayScore} · {p.phase}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-muted">{RESULT_BADGE[p.resultType] ?? p.resultType}</p>
                <p className="font-mono text-text-primary">{p.pointsEarned} pts</p>
              </div>
            </div>
          ))}
        </GlassCard>
      )}
    </>
  );
}

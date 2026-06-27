import { GlassCard } from "@/components/ui/glass-card";

interface ResultRow {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homeScore: number;
  awayScore: number;
  phase: string;
  predictions: { name: string; homeScore: number; awayScore: number }[];
}

export function PublicRecentResults({ matches, showPredictions }: { matches: ResultRow[]; showPredictions: boolean }) {
  return (
    <GlassCard className="flex flex-col gap-3">
      <h2 className="font-display text-2xl tracking-wide text-text-primary">⚽ Últimos Resultados</h2>

      {matches.length === 0 && <p className="text-text-muted">Todavía no hay resultados.</p>}

      {matches.map((m) => (
        <div key={m.id} className="border-b border-border-glass pb-3 last:border-0">
          <div className="flex items-center justify-between">
            <p className="text-text-primary">
              {m.homeFlag} {m.homeTeam} <span className="font-mono">{m.homeScore}-{m.awayScore}</span> {m.awayTeam} {m.awayFlag}
            </p>
            <span className="text-xs text-text-muted">{m.phase}</span>
          </div>

          {showPredictions && m.predictions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-muted">
              {m.predictions.map((p, i) => (
                <span key={i} className="rounded bg-bg-glass px-2 py-1">
                  {p.name}: {p.homeScore}-{p.awayScore}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </GlassCard>
  );
}

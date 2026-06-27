import { GlassCard } from "@/components/ui/glass-card";

interface FixtureRow {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  matchDateLabel: string;
  deadlineLabel: string;
}

// La fecha/countdown se calcula en el servidor al momento del render: como la
// página revalida cada 60s (no es una sesión de apuesta en vivo), un texto
// estático "en Xh Ym" es suficiente y evita necesitar un componente cliente.
export function PublicFixture({ matches }: { matches: FixtureRow[] }) {
  return (
    <GlassCard className="flex flex-col gap-3">
      <h2 className="font-display text-2xl tracking-wide text-text-primary">📅 Próximos Partidos</h2>

      {matches.length === 0 && <p className="text-text-muted">No hay partidos próximos.</p>}

      {matches.map((m) => (
        <div key={m.id} className="flex items-center justify-between border-b border-border-glass pb-2 last:border-0">
          <p className="text-text-primary">
            {m.homeFlag} {m.homeTeam} <span className="text-text-muted">vs</span> {m.awayTeam} {m.awayFlag}
          </p>
          <div className="text-right text-xs text-text-muted">
            <p>{m.matchDateLabel}</p>
            <p>Cierre de apuestas: {m.deadlineLabel}</p>
          </div>
        </div>
      ))}
    </GlassCard>
  );
}

import { formatDateTimePeru, formatTimePeru } from "@/lib/date-peru";

interface MatchPreview {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  matchDate: Date;
}

// Fila de partido estilo "casa de apuestas": bandera + equipo a cada lado,
// marcador o "vs" al centro, badge de estado a la derecha. Usado en la
// landing pública (Server Component, sin sesión).
export function MatchPreviewRow({
  match,
  tournamentLabel,
  showDate = true,
}: {
  match: MatchPreview;
  /** Nombre corto del torneo, solo útil cuando se mezclan partidos de varios torneos en una misma lista. */
  tournamentLabel?: string;
  /** false cuando la fila ya vive dentro de una tarjeta agrupada por día ("Hoy"/"Mañana"): alcanza con la hora. */
  showDate?: boolean;
}) {
  const hasScore = match.homeScore !== null && match.awayScore !== null;

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-bg-glass px-3 py-2 text-sm">
      <div className="flex flex-1 items-center justify-end gap-1.5 truncate text-right">
        <span className="truncate text-text-primary">{match.homeTeam}</span>
        <span>{match.homeFlag}</span>
      </div>

      <div className="flex shrink-0 flex-col items-center px-1">
        {hasScore ? (
          <span className="font-mono text-base font-bold text-text-primary">
            {match.homeScore}-{match.awayScore}
          </span>
        ) : (
          <span className="text-xs text-text-muted">vs</span>
        )}
        <StatusBadge status={match.status} matchDate={match.matchDate} showDate={showDate} />
        {tournamentLabel && <span className="text-[9px] text-text-muted/70">{tournamentLabel}</span>}
      </div>

      <div className="flex flex-1 items-center gap-1.5 truncate">
        <span>{match.awayFlag}</span>
        <span className="truncate text-text-primary">{match.awayTeam}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status, matchDate, showDate }: { status: string; matchDate: Date; showDate: boolean }) {
  if (status === "LIVE") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-error">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-error" />
        En vivo
      </span>
    );
  }
  if (status === "FINISHED") {
    return <span className="text-[10px] font-semibold uppercase tracking-wide text-success">Final</span>;
  }
  if (status === "CANCELLED") {
    return <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Cancelado</span>;
  }
  return (
    <span className="text-[10px] text-text-muted">{showDate ? formatDateTimePeru(matchDate) : formatTimePeru(matchDate)}</span>
  );
}

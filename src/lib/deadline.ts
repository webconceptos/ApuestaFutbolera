// El cierre de apuestas es automático: no hay cron ni job, simplemente se
// recalcula en cada request comparando "ahora" contra matchDate menos el
// deadline configurado por la polla (PoolConfig.predictionDeadlineHours).
export function isPredictionOpen(matchDate: Date, deadlineHours: number, matchStatus: string) {
  if (matchStatus !== "UPCOMING") return false;
  const deadline = new Date(matchDate.getTime() - deadlineHours * 60 * 60 * 1000);
  return new Date() < deadline;
}

export function predictionDeadline(matchDate: Date, deadlineHours: number) {
  return new Date(matchDate.getTime() - deadlineHours * 60 * 60 * 1000);
}

// Texto estático ("en 3h 22min"), pensado para Server Components que no
// pueden actualizarse en vivo (ej. el panel público, que revalida cada 60s).
export function formatTimeRemaining(target: Date): string {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return "cerrado";
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `en ${days}d ${hours}h`;
  if (hours > 0) return `en ${hours}h ${minutes}min`;
  return `en ${minutes}min`;
}

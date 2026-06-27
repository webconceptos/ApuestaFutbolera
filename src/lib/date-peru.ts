// src/lib/date-peru.ts

export const PERU_TIMEZONE = "America/Lima";

export function formatDateTimePeru(date: string | Date) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: PERU_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

export function toDatetimeLocalPeru(date: string | Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PERU_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(date));

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function peruDatetimeLocalToUtc(value: string) {
  return new Date(`${value}:00-05:00`).toISOString();
}

export function formatDatePeru(date: string | Date) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: PERU_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(date));
}

export function formatTimePeru(date: string | Date) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: PERU_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

// Rango [start, end) en instantes UTC reales para un día calendario en Lima
// (offsetDays=0 -> hoy, 1 -> mañana, etc). Perú no tiene horario de verano,
// así que el offset fijo -05:00 es válido todo el año — usado para filtrar
// partidos "de hoy"/"de mañana" en consultas a la DB (matchDate >= start &&
// matchDate < end), sin importar la zona horaria del servidor.
export function getLimaDayRange(offsetDays: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PERU_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  const start = new Date(`${get("year")}-${get("month")}-${get("day")}T00:00:00-05:00`);
  start.setUTCDate(start.getUTCDate() + offsetDays);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

/** "YYYY-MM-DD" del día calendario en Lima al que pertenece esta fecha — clave para agrupar partidos por día. */
export function getLimaDateKey(date: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: PERU_TIMEZONE }).format(new Date(date));
}

/** Etiqueta legible para una clave "YYYY-MM-DD" de getLimaDateKey: "Hoy", "Mañana", o "lun 23 jun". */
export function formatDayLabel(dateKey: string): string {
  const todayKey = getLimaDateKey(new Date());
  const tomorrowKey = getLimaDateKey(getLimaDayRange(1).start);
  if (dateKey === todayKey) return "Hoy";
  if (dateKey === tomorrowKey) return "Mañana";

  const date = new Date(`${dateKey}T12:00:00-05:00`); // mediodía para evitar líos de borde de día
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: PERU_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}
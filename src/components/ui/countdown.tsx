"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number) {
  if (ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Igual que ClientDate: el cálculo depende de "ahora", así que se resuelve
// solo en cliente tras el montaje para no romper la hidratación.
export function Countdown({ deadlineIso, closedLabel = "Cerrado" }: { deadlineIso: string; closedLabel?: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    function update() {
      const remaining = new Date(deadlineIso).getTime() - Date.now();
      const formatted = formatRemaining(remaining);
      setLabel(formatted ?? closedLabel);
    }
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [deadlineIso, closedLabel]);

  if (label === null) return null;
  return <span>{label}</span>;
}

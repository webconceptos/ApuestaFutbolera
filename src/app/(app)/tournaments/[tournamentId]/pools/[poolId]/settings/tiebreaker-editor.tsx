"use client";

import { useState } from "react";
import { labelClass } from "@/components/ui/form-styles";

const CRITERIA_LABEL: Record<string, string> = {
  exactScores: "Más marcadores exactos",
  goalDiff: "Predicción más precisa (menor diferencia de gol)",
  totalGoals: "Menos goles totales predichos",
  alphabetical: "Nombre A → Z",
  joinedDate: "Quien se unió primero",
};
const ALL_CRITERIA = Object.keys(CRITERIA_LABEL);

export function TiebreakerEditor({ name, initialCsv }: { name: string; initialCsv: string }) {
  const initialOrder = initialCsv
    .split(",")
    .map((c) => c.trim())
    .filter((c) => ALL_CRITERIA.includes(c));
  const missing = ALL_CRITERIA.filter((c) => !initialOrder.includes(c));

  const [order, setOrder] = useState<string[]>([...initialOrder, ...missing]);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_CRITERIA.map((c) => [c, initialOrder.includes(c)]))
  );

  function move(index: number, direction: -1 | 1) {
    const next = [...order];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  }

  const csv = order.filter((c) => enabled[c]).join(",");

  return (
    <div className="flex flex-col gap-2">
      <p className={labelClass}>Criterios de desempate (en orden de prioridad)</p>
      <ul className="flex flex-col gap-1">
        {order.map((criterion, index) => (
          <li
            key={criterion}
            className="flex items-center justify-between gap-2 rounded-lg border border-border-glass bg-bg-glass px-3 py-2"
          >
            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input
                type="checkbox"
                checked={enabled[criterion]}
                onChange={(e) => setEnabled((prev) => ({ ...prev, [criterion]: e.target.checked }))}
                className="h-4 w-4 accent-gold-start"
              />
              {CRITERIA_LABEL[criterion]}
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="rounded px-2 py-0.5 text-text-muted hover:bg-white/10 disabled:opacity-30"
                aria-label="Subir prioridad"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === order.length - 1}
                className="rounded px-2 py-0.5 text-text-muted hover:bg-white/10 disabled:opacity-30"
                aria-label="Bajar prioridad"
              >
                ↓
              </button>
            </div>
          </li>
        ))}
      </ul>
      <input type="hidden" name={name} value={csv} />
      <p className="text-xs text-text-muted">Si todos los criterios marcados empatan, se usa el orden alfabético como último recurso.</p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { labelClass, inputClass, buttonClass, errorClass, successClass } from "@/components/ui/form-styles";

interface ResultFormProps {
  tournamentId: string;
  matchId: string;
  initialHomeScore: number | null;
  initialAwayScore: number | null;
}

export function ResultForm({ tournamentId, matchId, initialHomeScore, initialAwayScore }: ResultFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSummary(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      homeScore: formData.get("homeScore"),
      awayScore: formData.get("awayScore"),
    };

    try {
      const res = await fetch(`/api/superadmin/tournaments/${tournamentId}/matches/${matchId}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "No se pudo guardar el resultado");
        return;
      }

      setSummary(data.message);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h3 className="font-display text-xl tracking-wide text-text-primary">Ingresar resultado</h3>
      <p className="text-xs text-text-muted">
        Marca el partido como finalizado y recalcula los puntos de todas las predicciones y el ranking de cada
        polla afectada.
      </p>

      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="homeScore" className={labelClass}>
            Local
          </label>
          <input
            id="homeScore"
            name="homeScore"
            type="number"
            min={0}
            max={50}
            defaultValue={initialHomeScore ?? ""}
            required
            className={`${inputClass} w-20`}
          />
        </div>
        <span className="pb-2 text-text-muted">—</span>
        <div className="flex flex-col gap-1">
          <label htmlFor="awayScore" className={labelClass}>
            Visitante
          </label>
          <input
            id="awayScore"
            name="awayScore"
            type="number"
            min={0}
            max={50}
            defaultValue={initialAwayScore ?? ""}
            required
            className={`${inputClass} w-20`}
          />
        </div>
      </div>

      {error && <p className={errorClass}>{error}</p>}
      {summary && <p className={successClass}>{summary}</p>}

      <button type="submit" disabled={loading} className={`${buttonClass} self-start`}>
        {loading ? "Guardando..." : "Guardar resultado"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { labelClass, inputClass, buttonClass, errorClass } from "@/components/ui/form-styles";
import { toDatetimeLocalPeru, peruDatetimeLocalToUtc } from "@/lib/date-peru";

interface MatchFormProps {
  tournamentId: string;
  matchId?: string;
  initial?: {
    phase: string;
    round: string;
    homeTeam: string;
    awayTeam: string;
    homeFlag: string;
    awayFlag: string;
    matchDate: string;
    venue: string;
    city: string;
    status: string;
  };
}

const DEFAULTS = {
  phase: "",
  round: "",
  homeTeam: "",
  awayTeam: "",
  homeFlag: "🏳️",
  awayFlag: "🏳️",
  matchDate: "",
  venue: "",
  city: "",
  status: "UPCOMING",
};

export function MatchForm({ tournamentId, matchId, initial }: MatchFormProps) {
  const router = useRouter();
  const values = initial ?? DEFAULTS;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const matchDateInput = formData.get("matchDate") as string;
    const payload = {
      phase: formData.get("phase"),
      round: formData.get("round"),
      homeTeam: formData.get("homeTeam"),
      awayTeam: formData.get("awayTeam"),
      homeFlag: formData.get("homeFlag"),
      awayFlag: formData.get("awayFlag"),
      matchDate: peruDatetimeLocalToUtc(matchDateInput),
      venue: formData.get("venue"),
      city: formData.get("city"),
      status: formData.get("status"),
    };

    try {
      const base = `/api/superadmin/tournaments/${tournamentId}/matches`;
      const url = matchId ? `${base}/${matchId}` : base;
      const res = await fetch(url, {
        method: matchId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "No se pudo guardar el partido");
        return;
      }

      router.push(`/superadmin/tournaments/${tournamentId}/matches`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="phase" className={labelClass}>
            Fase
          </label>
          <input
            id="phase"
            name="phase"
            type="text"
            defaultValue={values.phase}
            required
            placeholder="Fase de Grupos - Grupo A"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="round" className={labelClass}>
            Jornada (opcional)
          </label>
          <input id="round" name="round" type="number" min={1} defaultValue={values.round} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="homeFlag" className={labelClass}>
            Bandera local
          </label>
          <input id="homeFlag" name="homeFlag" type="text" defaultValue={values.homeFlag} required className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="homeTeam" className={labelClass}>
            Equipo local
          </label>
          <input id="homeTeam" name="homeTeam" type="text" defaultValue={values.homeTeam} required className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="awayFlag" className={labelClass}>
            Bandera visitante
          </label>
          <input id="awayFlag" name="awayFlag" type="text" defaultValue={values.awayFlag} required className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="awayTeam" className={labelClass}>
            Equipo visitante
          </label>
          <input id="awayTeam" name="awayTeam" type="text" defaultValue={values.awayTeam} required className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="matchDate" className={labelClass}>
            Fecha y hora
          </label>
          <input
            id="matchDate"
            name="matchDate"
            type="datetime-local"
            defaultValue={values.matchDate ? toDatetimeLocalPeru(values.matchDate) : ""}
            required
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="status" className={labelClass}>
            Estado
          </label>
          <select id="status" name="status" defaultValue={values.status} className={inputClass}>
            <option value="UPCOMING">Próximo</option>
            <option value="LIVE">En vivo</option>
            <option value="FINISHED">Finalizado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="venue" className={labelClass}>
            Estadio
          </label>
          <input id="venue" name="venue" type="text" defaultValue={values.venue} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="city" className={labelClass}>
            Ciudad
          </label>
          <input id="city" name="city" type="text" defaultValue={values.city} className={inputClass} />
        </div>
      </div>

      {error && <p className={errorClass}>{error}</p>}

      <button type="submit" disabled={loading} className={`${buttonClass} self-start`}>
        {loading ? "Guardando..." : matchId ? "Guardar cambios" : "Crear partido"}
      </button>
    </form>
  );
}

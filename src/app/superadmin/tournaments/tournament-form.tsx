"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { labelClass, inputClass, buttonClass, errorClass } from "@/components/ui/form-styles";

interface TournamentFormProps {
  tournamentId?: string;
  initial?: {
    name: string;
    shortName: string;
    logo: string;
    sport: string;
    country: string;
    season: string;
    startDate: string;
    endDate: string;
    isPublic: boolean;
    description: string;
  };
}

const DEFAULTS = {
  name: "",
  shortName: "",
  logo: "",
  sport: "football",
  country: "",
  season: "",
  startDate: "",
  endDate: "",
  isPublic: true,
  description: "",
};

export function TournamentForm({ tournamentId, initial }: TournamentFormProps) {
  const router = useRouter();
  const values = initial ?? DEFAULTS;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      shortName: formData.get("shortName"),
      logo: formData.get("logo"),
      sport: formData.get("sport"),
      country: formData.get("country"),
      season: formData.get("season"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      isPublic: formData.get("isPublic") === "on",
      description: formData.get("description"),
    };

    try {
      const url = tournamentId ? `/api/superadmin/tournaments/${tournamentId}` : "/api/superadmin/tournaments";
      const res = await fetch(url, {
        method: tournamentId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "No se pudo guardar el torneo");
        return;
      }

      router.push("/superadmin/tournaments");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className={labelClass}>
            Nombre completo
          </label>
          <input id="name" name="name" type="text" defaultValue={values.name} required minLength={2} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="shortName" className={labelClass}>
            Nombre corto
          </label>
          <input
            id="shortName"
            name="shortName"
            type="text"
            defaultValue={values.shortName}
            required
            minLength={2}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="sport" className={labelClass}>
            Deporte
          </label>
          <input id="sport" name="sport" type="text" defaultValue={values.sport} required className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="season" className={labelClass}>
            Temporada
          </label>
          <input id="season" name="season" type="text" defaultValue={values.season} required placeholder="2026" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="country" className={labelClass}>
            País / región
          </label>
          <input id="country" name="country" type="text" defaultValue={values.country} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="logo" className={labelClass}>
            URL del logo
          </label>
          <input id="logo" name="logo" type="text" defaultValue={values.logo} placeholder="https://..." className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="startDate" className={labelClass}>
            Fecha de inicio
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={values.startDate}
            required
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="endDate" className={labelClass}>
            Fecha de fin
          </label>
          <input id="endDate" name="endDate" type="date" defaultValue={values.endDate} required className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className={labelClass}>
          Descripción
        </label>
        <textarea id="description" name="description" defaultValue={values.description} rows={3} className={inputClass} />
      </div>

      <label className="flex items-center gap-2 text-sm text-text-primary">
        <input type="checkbox" name="isPublic" defaultChecked={values.isPublic} className="h-4 w-4 accent-gold-start" />
        Visible en la landing pública
      </label>

      {error && <p className={errorClass}>{error}</p>}

      <button type="submit" disabled={loading} className={`${buttonClass} self-start`}>
        {loading ? "Guardando..." : tournamentId ? "Guardar cambios" : "Crear torneo"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { labelClass, inputClass, buttonClass, errorClass } from "@/components/ui/form-styles";

export function PoolCreateForm({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      description: formData.get("description"),
      logo: formData.get("logo"),
      inviteOnly: formData.get("inviteOnly") === "on",
    };

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/pools`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "No se pudo crear la polla");
        return;
      }

      router.push(`/tournaments/${tournamentId}/pools/${data.pool.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className={labelClass}>
          Nombre de la polla
        </label>
        <input id="name" name="name" type="text" required minLength={2} placeholder="La Oficina CGR" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className={labelClass}>
          Descripción (opcional)
        </label>
        <textarea id="description" name="description" rows={2} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="logo" className={labelClass}>
          URL del logo (opcional)
        </label>
        <input id="logo" name="logo" type="text" placeholder="https://..." className={inputClass} />
      </div>

      <label className="flex items-center gap-2 text-sm text-text-primary">
        <input type="checkbox" name="inviteOnly" defaultChecked className="h-4 w-4 accent-gold-start" />
        Solo por invitación (si lo desmarcas, cualquiera puede unirse desde la página del torneo)
      </label>

      {error && <p className={errorClass}>{error}</p>}

      <button type="submit" disabled={loading} className={`${buttonClass} self-start`}>
        {loading ? "Creando..." : "Crear polla"}
      </button>
    </form>
  );
}

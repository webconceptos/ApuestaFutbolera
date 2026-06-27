"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { labelClass, inputClass, dangerButtonClass, errorClass } from "@/components/ui/form-styles";

export function DeletePoolForm({ poolId }: { poolId: string }) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/pools/${poolId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "No se pudo eliminar la polla");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="text-sm text-text-muted">
        Se eliminarán la polla, sus predicciones, miembros y notificaciones. Esta acción no se puede deshacer.
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirmation" className={labelClass}>
          Escribe <span className="font-mono text-error">ELIMINAR</span> para confirmar
        </label>
        <input
          id="confirmation"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          className={`${inputClass} max-w-xs`}
        />
      </div>

      {error && <p className={errorClass}>{error}</p>}

      <button
        type="submit"
        disabled={loading || confirmation !== "ELIMINAR"}
        className={`${dangerButtonClass} self-start`}
      >
        {loading ? "Eliminando..." : "Eliminar polla"}
      </button>
    </form>
  );
}

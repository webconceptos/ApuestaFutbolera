"use client";

import { useState } from "react";
import { labelClass, inputClass, dangerButtonClass, errorClass, successClass } from "@/components/ui/form-styles";

export function DeleteAccountForm() {
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/profile/danger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "No se pudo procesar la solicitud");
        return;
      }

      setSuccess(data.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return <p className={successClass}>{success}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="text-sm text-text-muted">
        Esta acción eliminará tus predicciones y saldrás de todas las pollas. Si eres OWNER de alguna polla, debes
        transferirla o eliminarla primero.
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirmation" className={labelClass}>
          Escribe <span className="font-mono text-error">ELIMINAR</span> para confirmar
        </label>
        <input
          id="confirmation"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && <p className={errorClass}>{error}</p>}

      <button type="submit" disabled={loading || confirmation !== "ELIMINAR"} className={`${dangerButtonClass} self-start`}>
        {loading ? "Enviando..." : "Solicitar eliminación"}
      </button>
    </form>
  );
}

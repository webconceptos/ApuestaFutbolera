"use client";

import { useState } from "react";
import { labelClass, inputClass, buttonClass, errorClass, successClass } from "@/components/ui/form-styles";

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const newEmail = formData.get("newEmail");
    const currentPassword = formData.get("currentPassword");

    try {
      const res = await fetch("/api/profile/security/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail, currentPassword }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "No se pudo solicitar el cambio");
        return;
      }

      setSuccess(data.message);
      (event.target as HTMLFormElement).reset();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h3 className="font-display text-xl tracking-wide text-text-primary">Cambiar email</h3>
      <p className="text-sm text-text-muted">
        Email actual: <span className="text-text-primary">{currentEmail}</span>
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="newEmail" className={labelClass}>
          Nuevo email
        </label>
        <input id="newEmail" name="newEmail" type="email" required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="currentPassword" className={labelClass}>
          Contraseña actual (para confirmar)
        </label>
        <input id="currentPassword" name="currentPassword" type="password" required className={inputClass} />
      </div>

      {error && <p className={errorClass}>{error}</p>}
      {success && <p className={successClass}>{success}</p>}

      <button type="submit" disabled={loading} className={`${buttonClass} self-start`}>
        {loading ? "Enviando..." : "Solicitar cambio"}
      </button>
    </form>
  );
}

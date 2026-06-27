"use client";

import { useState } from "react";
import { labelClass, inputClass, buttonClass, errorClass } from "../auth-styles";

export function RequestResetForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const email = new FormData(event.currentTarget).get("email");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
    return (
      <div className="glass-surface w-full max-w-sm rounded-2xl p-6 text-left">
        <p className="text-text-primary">{success}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-surface flex w-full max-w-sm flex-col gap-4 rounded-2xl p-6 text-left"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input id="email" name="email" type="email" required className={inputClass} />
      </div>

      {error && <p className={errorClass}>{error}</p>}

      <button type="submit" disabled={loading} className={buttonClass}>
        {loading ? "Enviando..." : "Enviar instrucciones"}
      </button>
    </form>
  );
}

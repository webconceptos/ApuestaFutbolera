"use client";

import { useState } from "react";
import { labelClass, inputClass, buttonClass, successClass } from "./auth-styles";

export function ResendVerificationForm({ initialEmail = "" }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return <p className={successClass}>Si la cuenta existe y no está verificada, te enviamos un nuevo email.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="resend-email" className={labelClass}>
        Reenviar email de verificación
      </label>
      <input
        id="resend-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        className={inputClass}
      />
      <button type="submit" disabled={loading} className={buttonClass}>
        {loading ? "Enviando..." : "Reenviar email"}
      </button>
    </form>
  );
}

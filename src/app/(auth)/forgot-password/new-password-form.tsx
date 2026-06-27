"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { labelClass, inputClass, buttonClass, errorClass } from "../auth-styles";

export function NewPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "No se pudo restablecer la contraseña");
        return;
      }

      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-surface flex w-full max-w-sm flex-col gap-4 rounded-2xl p-6 text-left"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className={labelClass}>
          Nueva contraseña
        </label>
        <input id="password" name="password" type="password" required minLength={8} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className={labelClass}>
          Confirmar contraseña
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className={inputClass}
        />
      </div>

      {error && <p className={errorClass}>{error}</p>}

      <button type="submit" disabled={loading} className={buttonClass}>
        {loading ? "Guardando..." : "Restablecer contraseña"}
      </button>
    </form>
  );
}

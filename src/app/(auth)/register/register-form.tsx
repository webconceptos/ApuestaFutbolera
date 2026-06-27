"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { labelClass, inputClass, buttonClass, errorClass } from "../auth-styles";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    };
    const confirmPassword = formData.get("confirmPassword");

    if (payload.password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "No se pudo crear la cuenta");
        return;
      }

      if (!data.requiresVerification) {
        // Caso borde: primer usuario del sistema, ya queda verificado.
        await signIn("credentials", { email: payload.email, password: payload.password, redirect: false });
        router.push("/superadmin");
        return;
      }

      setSuccess(data.message ?? "Revisa tu email para verificar tu cuenta.");
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
        <label htmlFor="name" className={labelClass}>
          Nombre completo
        </label>
        <input id="name" name="name" type="text" required minLength={2} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input id="email" name="email" type="email" required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className={labelClass}>
          Contraseña
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
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
}

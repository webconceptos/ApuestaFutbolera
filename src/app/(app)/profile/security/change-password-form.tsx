"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { labelClass, inputClass, buttonClass, errorClass, successClass } from "@/components/ui/form-styles";

export function ChangePasswordForm({ email }: { email: string }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);
    const currentPassword = formData.get("currentPassword");
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword");

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/profile/security/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "No se pudo cambiar la contraseña");
        return;
      }

      // El cambio de contraseña invalida los JWT emitidos antes de ahora
      // (ver callback jwt en src/lib/auth.ts), incluida esta misma sesión:
      // nos re-logueamos en silencio con la nueva contraseña.
      await signIn("credentials", { email, password: newPassword, redirect: false });

      setSuccess(true);
      (event.target as HTMLFormElement).reset();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h3 className="font-display text-xl tracking-wide text-text-primary">Cambiar contraseña</h3>

      <div className="flex flex-col gap-1">
        <label htmlFor="currentPassword" className={labelClass}>
          Contraseña actual
        </label>
        <input id="currentPassword" name="currentPassword" type="password" required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="newPassword" className={labelClass}>
          Nueva contraseña
        </label>
        <input id="newPassword" name="newPassword" type="password" required minLength={8} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className={labelClass}>
          Confirmar nueva contraseña
        </label>
        <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} className={inputClass} />
      </div>

      {error && <p className={errorClass}>{error}</p>}
      {success && <p className={successClass}>Contraseña actualizada.</p>}

      <button type="submit" disabled={loading} className={`${buttonClass} self-start`}>
        {loading ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}

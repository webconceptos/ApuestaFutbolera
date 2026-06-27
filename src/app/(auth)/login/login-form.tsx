"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { labelClass, inputClass, buttonClass, errorClass } from "../auth-styles";
import { ResendVerificationForm } from "../resend-verification-form";

export function LoginForm({ callbackUrl, initialError }: { callbackUrl?: string; initialError: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(initialError);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setUnverifiedEmail(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", { email, password, redirect: false });

      if (result?.error) {
        if (result.code === "account_suspended") setError("Tu cuenta fue suspendida. Contacta al administrador.");
        else if (result.code === "email_not_verified") {
          setError("Verifica tu email antes de iniciar sesión.");
          setUnverifiedEmail(email);
        } else setError("Email o contraseña incorrectos.");
        return;
      }

      router.push(callbackUrl ?? "/dashboard");
      router.refresh();
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
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input id="email" name="email" type="email" required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className={labelClass}>
            Contraseña
          </label>
          <Link href="/forgot-password" className="text-xs text-text-muted underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <input id="password" name="password" type="password" required className={inputClass} />
      </div>

      {error && <p className={errorClass}>{error}</p>}

      <button type="submit" disabled={loading} className={buttonClass}>
        {loading ? "Ingresando..." : "Ingresar"}
      </button>

      {unverifiedEmail && (
        <div className="border-t border-border-glass pt-3">
          <ResendVerificationForm initialEmail={unverifiedEmail} />
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span className="h-px flex-1 bg-border-glass" /> o <span className="h-px flex-1 bg-border-glass" />
      </div>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: callbackUrl ?? "/dashboard" })}
        className="rounded-lg border border-border-glass bg-bg-glass px-4 py-2 font-semibold text-text-primary hover:bg-white/10"
      >
        Continuar con Google
      </button>
    </form>
  );
}

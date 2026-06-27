"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { labelClass, inputClass, buttonClass, errorClass } from "../auth-styles";

export function SetupForm() {
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
      email: formData.get("email"),
      password: formData.get("password"),
      appName: formData.get("appName"),
    };

    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "No se pudo completar el setup");
        return;
      }

      const signInResult = await signIn("credentials", {
        email: payload.email,
        password: payload.password,
        redirect: false,
      });

      if (signInResult?.error) {
        // El usuario se creó correctamente; si el inicio de sesión automático
        // falla por algún motivo, lo enviamos a /login para que entre manualmente.
        router.push("/login");
        return;
      }

      router.push("/superadmin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-surface flex w-full max-w-sm flex-col gap-4 rounded-2xl p-6 text-left">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className={labelClass}>
          Nombre del primer administrador
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
        <label htmlFor="appName" className={labelClass}>
          Nombre de la aplicación
        </label>
        <input id="appName" name="appName" type="text" defaultValue="Golazo Mundial" required className={inputClass} />
      </div>

      {error && <p className={errorClass}>{error}</p>}

      <button type="submit" disabled={loading} className={buttonClass}>
        {loading ? "Configurando..." : "Completar configuración"}
      </button>
    </form>
  );
}

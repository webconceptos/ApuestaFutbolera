"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { labelClass, inputClass, buttonClass, secondaryButtonClass, errorClass } from "@/components/ui/form-styles";

function generatePassword() {
  return Math.random().toString(36).slice(-6) + Math.random().toString(36).slice(-6).toUpperCase();
}

export function UserCreateForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
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
      username: formData.get("username"),
      password: formData.get("password"),
      role: formData.get("role"),
      sendWelcomeEmail: formData.get("sendWelcomeEmail") === "on",
      markVerified: formData.get("markVerified") === "on",
      internalNote: formData.get("internalNote"),
    };

    try {
      const res = await fetch("/api/superadmin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "No se pudo crear el usuario");
        return;
      }

      router.push("/superadmin/users");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <label htmlFor="username" className={labelClass}>
            Username (opcional)
          </label>
          <input id="username" name="username" type="text" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="role" className={labelClass}>
            Rol global
          </label>
          <select id="role" name="role" defaultValue="USER" className={inputClass}>
            <option value="USER">Usuario</option>
            <option value="TOURNAMENT_MANAGER">Tournament Manager</option>
            <option value="SUPERADMIN">Superadmin</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="password" className={labelClass}>
            Contraseña temporal
          </label>
          <div className="flex gap-2">
            <input
              id="password"
              name="password"
              type="text"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <button type="button" onClick={() => setPassword(generatePassword())} className={secondaryButtonClass}>
              Generar
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="internalNote" className={labelClass}>
          Nota interna (solo visible para superadmins)
        </label>
        <textarea id="internalNote" name="internalNote" rows={2} className={inputClass} />
      </div>

      <label className="flex items-center gap-2 text-sm text-text-primary">
        <input type="checkbox" name="sendWelcomeEmail" defaultChecked className="h-4 w-4 accent-gold-start" />
        Enviar email de bienvenida con las credenciales
      </label>

      <label className="flex items-center gap-2 text-sm text-text-primary">
        <input type="checkbox" name="markVerified" defaultChecked className="h-4 w-4 accent-gold-start" />
        Marcar como verificado (sin requerir confirmación de email)
      </label>

      {error && <p className={errorClass}>{error}</p>}

      <button type="submit" disabled={loading} className={`${buttonClass} self-start`}>
        {loading ? "Creando..." : "Crear usuario"}
      </button>
    </form>
  );
}

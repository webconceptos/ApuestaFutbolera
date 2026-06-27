"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { labelClass, inputClass, buttonClass, errorClass, successClass } from "@/components/ui/form-styles";

interface UserInfoFormProps {
  userId: string;
  isSelf: boolean;
  initial: {
    name: string;
    username: string;
    phone: string;
    bio: string;
    role: string;
    internalNote: string;
  };
}

export function UserInfoForm({ userId, isSelf, initial }: UserInfoFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);
    const role = formData.get("role") as string;

    if (role !== initial.role && !confirm(`¿Cambiar el rol de este usuario a ${role}?`)) {
      return;
    }

    setLoading(true);
    const payload = {
      name: formData.get("name"),
      username: formData.get("username"),
      phone: formData.get("phone"),
      bio: formData.get("bio"),
      role,
      internalNote: formData.get("internalNote"),
    };

    try {
      const res = await fetch(`/api/superadmin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "No se pudo guardar");
        return;
      }

      setSuccess(true);
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
          <input id="name" name="name" type="text" defaultValue={initial.name} required minLength={2} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="username" className={labelClass}>
            Username
          </label>
          <input id="username" name="username" type="text" defaultValue={initial.username} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className={labelClass}>
            Teléfono
          </label>
          <input id="phone" name="phone" type="text" defaultValue={initial.phone} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="role" className={labelClass}>
            Rol global
          </label>
          <select id="role" name="role" defaultValue={initial.role} disabled={isSelf} className={inputClass}>
            <option value="USER">Usuario</option>
            <option value="TOURNAMENT_MANAGER">Tournament Manager</option>
            <option value="SUPERADMIN">Superadmin</option>
          </select>
          {isSelf && <p className="text-xs text-text-muted">No puedes cambiar tu propio rol.</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="bio" className={labelClass}>
          Bio
        </label>
        <textarea id="bio" name="bio" defaultValue={initial.bio} maxLength={160} rows={2} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="internalNote" className={labelClass}>
          Nota interna (solo superadmins)
        </label>
        <textarea id="internalNote" name="internalNote" defaultValue={initial.internalNote} rows={3} className={inputClass} />
      </div>

      {error && <p className={errorClass}>{error}</p>}
      {success && <p className={successClass}>Cambios guardados.</p>}

      <button type="submit" disabled={loading} className={`${buttonClass} self-start`}>
        {loading ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

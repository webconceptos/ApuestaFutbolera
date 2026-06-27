"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UserRowActionsProps {
  id: string;
  isActive: boolean;
  isSelf: boolean;
  canImpersonate: boolean;
}

export function UserRowActions({ id, isActive, isSelf, canImpersonate }: UserRowActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function toggleActive() {
    setLoading("toggle");
    try {
      const res = await fetch(`/api/superadmin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error ?? "No se pudo actualizar");
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleResetPassword() {
    if (!confirm("¿Enviar email de restablecimiento de contraseña a este usuario?")) return;
    setLoading("reset");
    try {
      const res = await fetch(`/api/superadmin/users/${id}/reset-password`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.error ?? "No se pudo enviar el email");
        return;
      }
      alert(data.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleImpersonate() {
    if (!confirm("¿Iniciar sesión como este usuario?")) return;
    setLoading("impersonate");
    try {
      const res = await fetch(`/api/superadmin/users/${id}/impersonate`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.error ?? "No se pudo impersonar");
        return;
      }
      window.location.href = "/dashboard";
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {!isSelf && (
        <button
          type="button"
          disabled={loading !== null}
          onClick={toggleActive}
          className="text-gold-start hover:underline disabled:opacity-50"
        >
          {isActive ? "Suspender" : "Reactivar"}
        </button>
      )}
      <button
        type="button"
        disabled={loading !== null}
        onClick={handleResetPassword}
        className="text-text-muted hover:underline disabled:opacity-50"
      >
        Reset password
      </button>
      {canImpersonate && !isSelf && (
        <button
          type="button"
          disabled={loading !== null}
          onClick={handleImpersonate}
          className="text-info hover:underline disabled:opacity-50"
        >
          Impersonar
        </button>
      )}
    </div>
  );
}

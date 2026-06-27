"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TournamentRowActionsProps {
  id: string;
  isActive: boolean;
  isPublic: boolean;
  canDelete: boolean;
}

export function TournamentRowActions({ id, isActive, isPublic, canDelete }: TournamentRowActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle(field: "isActive" | "isPublic", value: boolean) {
    setLoading(true);
    try {
      await fetch(`/api/superadmin/tournaments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este torneo? Esta acción no se puede deshacer.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/superadmin/tournaments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error ?? "No se pudo eliminar");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <label className="flex items-center gap-1 text-text-muted">
        <input
          type="checkbox"
          checked={isActive}
          disabled={loading}
          onChange={(e) => toggle("isActive", e.target.checked)}
          className="h-4 w-4 accent-gold-start"
        />
        Activo
      </label>
      <label className="flex items-center gap-1 text-text-muted">
        <input
          type="checkbox"
          checked={isPublic}
          disabled={loading}
          onChange={(e) => toggle("isPublic", e.target.checked)}
          className="h-4 w-4 accent-gold-start"
        />
        Público
      </label>
      {canDelete && (
        <button type="button" disabled={loading} onClick={handleDelete} className="text-error hover:underline">
          Eliminar
        </button>
      )}
    </div>
  );
}

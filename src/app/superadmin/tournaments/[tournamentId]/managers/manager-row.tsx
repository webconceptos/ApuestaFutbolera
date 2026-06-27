"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ManagerRowProps {
  tournamentId: string;
  managerId: string;
  canEditMatches: boolean;
  canEnterResults: boolean;
  canCreateMatches: boolean;
}

export function ManagerRow({
  tournamentId,
  managerId,
  canEditMatches,
  canEnterResults,
  canCreateMatches,
}: ManagerRowProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function togglePermission(field: string, value: boolean) {
    setLoading(true);
    try {
      await fetch(`/api/superadmin/tournaments/${tournamentId}/managers/${managerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canEditMatches, canEnterResults, canCreateMatches, [field]: value }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    if (!confirm("¿Revocar el acceso de este manager a este torneo?")) return;
    setLoading(true);
    try {
      await fetch(`/api/superadmin/tournaments/${tournamentId}/managers/${managerId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <label className="flex items-center gap-1 text-text-muted">
        <input
          type="checkbox"
          checked={canEditMatches}
          disabled={loading}
          onChange={(e) => togglePermission("canEditMatches", e.target.checked)}
          className="h-4 w-4 accent-gold-start"
        />
        Editar
      </label>
      <label className="flex items-center gap-1 text-text-muted">
        <input
          type="checkbox"
          checked={canEnterResults}
          disabled={loading}
          onChange={(e) => togglePermission("canEnterResults", e.target.checked)}
          className="h-4 w-4 accent-gold-start"
        />
        Resultados
      </label>
      <label className="flex items-center gap-1 text-text-muted">
        <input
          type="checkbox"
          checked={canCreateMatches}
          disabled={loading}
          onChange={(e) => togglePermission("canCreateMatches", e.target.checked)}
          className="h-4 w-4 accent-gold-start"
        />
        Crear
      </label>
      <button type="button" disabled={loading} onClick={handleRevoke} className="text-error hover:underline disabled:opacity-50">
        Revocar
      </button>
    </div>
  );
}

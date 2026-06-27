"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/components/ui/form-styles";

export function JoinPublicPoolButton({ tournamentId, poolId }: { tournamentId: string; poolId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pools/${poolId}/join`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo unir");
        return;
      }
      router.push(`/tournaments/${tournamentId}/pools/${poolId}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" disabled={loading} onClick={handleJoin} className={`${buttonClass} px-3 py-1.5 text-sm`}>
        {loading ? "Uniendo..." : "Unirme"}
      </button>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonClass, errorClass } from "@/components/ui/form-styles";

export function JoinPoolButton({
  poolId,
  inviteCode,
  tournamentId,
  isAuthenticated,
}: {
  poolId: string;
  inviteCode: string;
  tournamentId: string;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quien recibe un link de invitación todavía puede no tener cuenta: en vez
  // de pegarle a /api/pools/[poolId]/join (que devolvería 401), lo mandamos
  // a crear su cuenta primero. register/page.tsx ya sabe volver acá mismo
  // (/join/[inviteCode]) si vuelve con sesión iniciada.
  if (!isAuthenticated) {
    return (
      <Link href={`/register?invite=${inviteCode}&pool=${poolId}`} className={buttonClass}>
        Crear cuenta para unirme
      </Link>
    );
  }

  async function handleJoin() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pools/${poolId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo unir a la polla");
        return;
      }
      router.push(`/tournaments/${tournamentId}/pools/${poolId}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" disabled={loading} onClick={handleJoin} className={buttonClass}>
        {loading ? "Uniéndome..." : "Unirme a la polla"}
      </button>
      {error && <p className={errorClass}>{error}</p>}
    </div>
  );
}

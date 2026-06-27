"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { secondaryButtonClass, errorClass } from "@/components/ui/form-styles";

const PROVIDER_LABELS: Record<string, string> = { google: "Google" };

export function LinkedAccounts({ providers }: { providers: string[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUnlink(provider: string) {
    setError(null);
    setLoading(provider);
    try {
      const res = await fetch(`/api/profile/security/accounts?provider=${provider}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo desvincular");
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-xl tracking-wide text-text-primary">Cuentas vinculadas</h3>

      {providers.length === 0 ? (
        <p className="text-sm text-text-muted">No tienes cuentas externas vinculadas.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {providers.map((provider) => (
            <li key={provider} className="flex items-center justify-between rounded-lg border border-border-glass px-3 py-2">
              <span className="text-text-primary">{PROVIDER_LABELS[provider] ?? provider}</span>
              <button
                type="button"
                disabled={loading === provider}
                onClick={() => handleUnlink(provider)}
                className="text-sm text-error hover:underline disabled:opacity-50"
              >
                {loading === provider ? "Desvinculando..." : "Desvincular"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className={errorClass}>{error}</p>}

      {!providers.includes("google") && (
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/profile/security" })}
          className={`${secondaryButtonClass} self-start`}
        >
          Vincular cuenta de Google
        </button>
      )}
    </div>
  );
}

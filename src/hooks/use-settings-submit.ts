"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Patrón repetido por las pestañas de configuración de polla (Paso 24):
// PATCH a una URL, mostrar error/success, refrescar el Server Component al guardar.
export function useSettingsSubmit(url: string, method: "PATCH" | "POST" | "DELETE" = "PATCH") {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(payload: unknown) {
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo guardar");
        return false;
      }
      setSuccess(true);
      router.refresh();
      return true;
    } finally {
      setLoading(false);
    }
  }

  return { submit, loading, error, success };
}

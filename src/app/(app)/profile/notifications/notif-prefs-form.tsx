"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass, errorClass, successClass } from "@/components/ui/form-styles";

interface NotifPrefs {
  email: { resultScored: boolean; rankChange: boolean; deadlineWarning: boolean; paymentConfirmed: boolean };
  inApp: { resultScored: boolean; rankChange: boolean; deadlineWarning: boolean };
}

const ROWS: { key: keyof NotifPrefs["email"]; label: string; hasInApp: boolean }[] = [
  { key: "resultScored", label: "Resultado de partido apostado", hasInApp: true },
  { key: "rankChange", label: "Cambio de posición en ranking", hasInApp: true },
  { key: "deadlineWarning", label: "Aviso de cierre de apuestas", hasInApp: true },
  { key: "paymentConfirmed", label: "Confirmación de pago", hasInApp: false },
];

export function NotifPrefsForm({ initial }: { initial: NotifPrefs }) {
  const router = useRouter();
  const [prefs, setPrefs] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function toggle(channel: "email" | "inApp", key: string) {
    setPrefs((prev) => ({
      ...prev,
      [channel]: { ...prev[channel], [key]: !(prev[channel] as Record<string, boolean>)[key] },
    }));
  }

  async function handleSave() {
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const res = await fetch("/api/profile/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
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
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 gap-y-3">
        <span />
        <span className="text-sm font-medium text-text-muted">In-App</span>
        <span className="text-sm font-medium text-text-muted">Email</span>

        {ROWS.map(({ key, label, hasInApp }) => (
          <Fragment key={key}>
            <span className="text-text-primary">{label}</span>
            <input
              type="checkbox"
              disabled={!hasInApp}
              checked={hasInApp ? prefs.inApp[key as keyof typeof prefs.inApp] : false}
              onChange={() => toggle("inApp", key)}
              className="h-4 w-4 accent-gold-start justify-self-center disabled:opacity-20"
            />
            <input
              type="checkbox"
              checked={prefs.email[key]}
              onChange={() => toggle("email", key)}
              className="h-4 w-4 accent-gold-start justify-self-center"
            />
          </Fragment>
        ))}
      </div>

      <p className="text-xs text-text-muted">
        Las notificaciones críticas (cambio de email, reset de contraseña) no se pueden desactivar.
      </p>

      {error && <p className={errorClass}>{error}</p>}
      {success && <p className={successClass}>Preferencias guardadas.</p>}

      <button type="button" disabled={loading} onClick={handleSave} className={`${buttonClass} self-start`}>
        {loading ? "Guardando..." : "Guardar preferencias"}
      </button>
    </div>
  );
}

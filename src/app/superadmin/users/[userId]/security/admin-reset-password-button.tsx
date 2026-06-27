"use client";

import { useState } from "react";
import { buttonClass, successClass, errorClass } from "@/components/ui/form-styles";

export function AdminResetPasswordButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleClick() {
    if (!confirm("¿Enviar email de restablecimiento de contraseña a este usuario?")) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/superadmin/users/${userId}/reset-password`, { method: "POST" });
      const data = await res.json().catch(() => null);
      setMessage(
        res.ok
          ? { type: "success", text: data.message }
          : { type: "error", text: data?.error ?? "No se pudo enviar el email" }
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" disabled={loading} onClick={handleClick} className={buttonClass}>
        {loading ? "Enviando..." : "Enviar reset de contraseña"}
      </button>
      {message && <p className={message.type === "success" ? successClass : errorClass}>{message.text}</p>}
    </div>
  );
}

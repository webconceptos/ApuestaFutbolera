"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, buttonClass, errorClass, successClass } from "@/components/ui/form-styles";

export function AddMemberForm({ poolId }: { poolId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/pools/${poolId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo agregar");
        return;
      }
      setSuccess(data.invited ? data.message : "Miembro agregado.");
      setEmail("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@ejemplo.com"
        className={`${inputClass} max-w-xs`}
      />
      <button type="submit" disabled={loading} className={buttonClass}>
        {loading ? "Agregando..." : "+ Agregar miembro"}
      </button>
      {error && <p className={errorClass}>{error}</p>}
      {success && <p className={successClass}>{success}</p>}
    </form>
  );
}

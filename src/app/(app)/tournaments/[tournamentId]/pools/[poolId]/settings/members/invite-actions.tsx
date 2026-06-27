"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { secondaryButtonClass } from "@/components/ui/form-styles";

export function InviteActions({ poolId, inviteCode, isOwner }: { poolId: string; inviteCode: string; isOwner: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState(inviteCode);
  const [link, setLink] = useState(`/join/${inviteCode}`);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLink(`${window.location.origin}/join/${code}`);
  }, [code]);

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerate() {
    if (!confirm("¿Generar un nuevo código? El anterior dejará de funcionar.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pools/${poolId}/regenerate-invite`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setCode(data.inviteCode);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="rounded-lg border border-border-glass bg-bg-glass px-3 py-2 text-sm text-text-primary">{link}</code>
      <button type="button" onClick={handleCopy} className={secondaryButtonClass}>
        {copied ? "¡Copiado!" : "Copiar link"}
      </button>
      {isOwner && (
        <button type="button" disabled={loading} onClick={handleRegenerate} className={secondaryButtonClass}>
          Generar nuevo código
        </button>
      )}
    </div>
  );
}

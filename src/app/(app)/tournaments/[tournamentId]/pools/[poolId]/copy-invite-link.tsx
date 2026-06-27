"use client";

import { useEffect, useState } from "react";
import { secondaryButtonClass } from "@/components/ui/form-styles";

export function CopyInviteLink({
  inviteCode,
  poolSlug,
  inviteOnly,
}: {
  inviteCode: string;
  poolSlug: string;
  inviteOnly: boolean;
}) {
  const [copied, setCopied] = useState(false);
  // window.location.origin no existe durante SSR: calcularlo en el primer
  // render produciría un mismatch de hidratación (servidor vs. cliente). Se
  // resuelve solo después del montaje, igual que con las fechas en ClientDate.
  const path = inviteOnly ? `/join/${inviteCode}` : `/p/${poolSlug}`;
  const [link, setLink] = useState(path);

  useEffect(() => {
    setLink(`${window.location.origin}${path}`);
  }, [path]);

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 truncate rounded-lg border border-border-glass bg-bg-glass px-3 py-2 text-sm text-text-primary">
        {link}
      </code>
      <button type="button" onClick={handleCopy} className={secondaryButtonClass}>
        {copied ? "¡Copiado!" : "Copiar"}
      </button>
    </div>
  );
}

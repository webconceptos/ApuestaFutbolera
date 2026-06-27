"use client";

import { useState } from "react";
import { secondaryButtonClass } from "@/components/ui/form-styles";

// Único componente cliente del panel público: usa la Web Share API (o copia
// al portapapeles) en el momento del click, no lee sesión ni nada dinámico,
// así que no compromete la cacheabilidad estática de la página (revalidate=60).
export function ShareButton({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // el usuario canceló el share nativo; cae al fallback de copiar
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={handleShare} className={secondaryButtonClass}>
      {copied ? "¡Link copiado!" : "Compartir"}
    </button>
  );
}

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { errorClass, secondaryButtonClass } from "@/components/ui/form-styles";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function AvatarUploader({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const initial = name.charAt(0).toUpperCase();

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Formato no soportado (usa jpg, png o webp)");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("La imagen no puede superar 2MB");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "No se pudo subir la imagen");
        return;
      }

      setPreview(data.avatarUrl);
      router.refresh();
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (!res.ok) {
        setError("No se pudo quitar la imagen");
        return;
      }
      setPreview(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={name} className="h-16 w-16 rounded-full object-cover" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-start/20 text-2xl font-semibold text-gold-start">
          {initial}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button type="button" disabled={loading} onClick={() => inputRef.current?.click()} className={secondaryButtonClass}>
            {loading ? "Subiendo..." : "Cambiar foto"}
          </button>
          {preview && (
            <button type="button" disabled={loading} onClick={handleRemove} className={secondaryButtonClass}>
              Quitar
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        {error && <p className={errorClass}>{error}</p>}
      </div>
    </div>
  );
}

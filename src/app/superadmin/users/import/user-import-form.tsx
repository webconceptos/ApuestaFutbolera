"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { labelClass, buttonClass, errorClass, successClass } from "@/components/ui/form-styles";

interface RowResult {
  row: number;
  email: string;
  status: "created" | "error";
  message?: string;
}

interface ImportResponse {
  success: boolean;
  created: number;
  errors: number;
  results: RowResult[];
}

export function UserImportForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [markVerified, setMarkVerified] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const csv = await file.text();
      const res = await fetch("/api/superadmin/users/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, sendWelcomeEmail, markVerified }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "No se pudo procesar el archivo");
        return;
      }

      setResult(data);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="csvFile" className={labelClass}>
            Archivo CSV
          </label>
          <input
            id="csvFile"
            type="file"
            accept=".csv,text/csv"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-text-primary file:mr-3 file:rounded-lg file:border-0 file:bg-gold-start file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={sendWelcomeEmail}
            onChange={(e) => setSendWelcomeEmail(e.target.checked)}
            className="h-4 w-4 accent-gold-start"
          />
          Enviar email de bienvenida con las credenciales a cada usuario
        </label>

        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={markVerified}
            onChange={(e) => setMarkVerified(e.target.checked)}
            className="h-4 w-4 accent-gold-start"
          />
          Marcar como verificados (sin requerir confirmación de email)
        </label>

        {error && <p className={errorClass}>{error}</p>}

        <button type="submit" disabled={loading || !file} className={`${buttonClass} self-start`}>
          {loading ? "Importando..." : "Importar"}
        </button>
      </form>

      {result && (
        <div className="flex flex-col gap-3 border-t border-border-glass pt-4">
          <p className={successClass}>
            {result.created} usuario(s) creado(s){result.errors > 0 ? `, ${result.errors} con error` : ""}.
          </p>

          {result.errors > 0 && (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border-glass text-text-muted">
                  <th className="py-1 pr-3 font-medium">Línea</th>
                  <th className="py-1 pr-3 font-medium">Email</th>
                  <th className="py-1 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {result.results
                  .filter((r) => r.status === "error")
                  .map((r) => (
                    <tr key={r.row} className="border-b border-border-glass last:border-0">
                      <td className="py-1 pr-3 font-mono text-text-muted">{r.row}</td>
                      <td className="py-1 pr-3 text-text-primary">{r.email || "—"}</td>
                      <td className="py-1 text-error">{r.message}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, buttonClass, errorClass } from "@/components/ui/form-styles";

interface UserResult {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function AssignManagerForm({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [selected, setSelected] = useState<UserResult | null>(null);
  const [permissions, setPermissions] = useState({
    canEditMatches: true,
    canEnterResults: true,
    canCreateMatches: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2 || selected) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/superadmin/users/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.users ?? []);
    }, 300);
  }, [query, selected]);

  async function handleAssign() {
    if (!selected) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/superadmin/tournaments/${tournamentId}/managers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected.id, ...permissions }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo asignar");
        return;
      }
      setSelected(null);
      setQuery("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-xl tracking-wide text-text-primary">Asignar manager</h3>

      {!selected ? (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar usuario por nombre o email"
            className={inputClass}
          />
          {results.length > 0 && (
            <ul className="glass-surface absolute z-10 mt-1 w-full rounded-lg p-1">
              {results.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(u);
                      setResults([]);
                    }}
                    className="flex w-full flex-col items-start rounded px-2 py-1.5 text-left hover:bg-white/5"
                  >
                    <span className="text-sm text-text-primary">{u.name}</span>
                    <span className="text-xs text-text-muted">{u.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="glass-surface flex items-center justify-between rounded-lg p-3">
          <div>
            <p className="text-sm text-text-primary">{selected.name}</p>
            <p className="text-xs text-text-muted">{selected.email}</p>
          </div>
          <button type="button" onClick={() => setSelected(null)} className="text-xs text-error hover:underline">
            Cambiar
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={permissions.canEditMatches}
            onChange={(e) => setPermissions((p) => ({ ...p, canEditMatches: e.target.checked }))}
            className="h-4 w-4 accent-gold-start"
          />
          Editar partidos
        </label>
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={permissions.canEnterResults}
            onChange={(e) => setPermissions((p) => ({ ...p, canEnterResults: e.target.checked }))}
            className="h-4 w-4 accent-gold-start"
          />
          Ingresar resultados
        </label>
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={permissions.canCreateMatches}
            onChange={(e) => setPermissions((p) => ({ ...p, canCreateMatches: e.target.checked }))}
            className="h-4 w-4 accent-gold-start"
          />
          Crear partidos
        </label>
      </div>

      {error && <p className={errorClass}>{error}</p>}

      <button
        type="button"
        disabled={!selected || loading}
        onClick={handleAssign}
        className={`${buttonClass} self-start`}
      >
        {loading ? "Asignando..." : "Asignar manager"}
      </button>
    </div>
  );
}

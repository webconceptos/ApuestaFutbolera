"use client";

import { labelClass, inputClass, buttonClass, errorClass, successClass } from "@/components/ui/form-styles";
import { useSettingsSubmit } from "@/hooks/use-settings-submit";

interface VisibilitySettings {
  inviteOnly: boolean;
  isPublic: boolean;
  registrationOpen: boolean;
  maxMembers: number;
  publicPanelEnabled: boolean;
  publicShowRanking: boolean;
  publicShowPredictions: boolean;
  publicShowFixture: boolean;
  showOthersPredictions: string;
}

const REVEAL_OPTIONS: { value: string; label: string }[] = [
  { value: "NEVER", label: "Nunca (solo el organizador las ve)" },
  { value: "AFTER_MATCH", label: "Cuando empieza el partido" },
  { value: "AFTER_SCORED", label: "Cuando se ingresa el resultado" },
  { value: "ALWAYS", label: "Siempre" },
];

export function VisibilitySettingsForm({ poolId, initial }: { poolId: string; initial: VisibilitySettings }) {
  const { submit, loading, error, success } = useSettingsSubmit(`/api/pools/${poolId}/visibility`);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await submit({
      inviteOnly: formData.get("inviteOnly") === "on",
      isPublic: formData.get("isPublic") === "on",
      registrationOpen: formData.get("registrationOpen") === "on",
      maxMembers: formData.get("maxMembers"),
      publicPanelEnabled: formData.get("publicPanelEnabled") === "on",
      publicShowRanking: formData.get("publicShowRanking") === "on",
      publicShowPredictions: formData.get("publicShowPredictions") === "on",
      publicShowFixture: formData.get("publicShowFixture") === "on",
      showOthersPredictions: formData.get("showOthersPredictions"),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className={labelClass}>Participantes</p>
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input type="checkbox" name="inviteOnly" defaultChecked={initial.inviteOnly} className="h-4 w-4 accent-gold-start" />
          Solo por invitación (controla quién puede unirse, no si aparece listada)
        </label>
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input type="checkbox" name="isPublic" defaultChecked={initial.isPublic} className="h-4 w-4 accent-gold-start" />
          Aparecer en la lista de pollas públicas del torneo
        </label>
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            name="registrationOpen"
            defaultChecked={initial.registrationOpen}
            className="h-4 w-4 accent-gold-start"
          />
          Inscripciones abiertas
        </label>
        <div className="flex flex-col gap-1">
          <label htmlFor="maxMembers" className={labelClass}>
            Máximo de participantes
          </label>
          <input
            id="maxMembers"
            name="maxMembers"
            type="number"
            min={2}
            max={500}
            defaultValue={initial.maxMembers}
            className={`${inputClass} max-w-32`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border-glass pt-4">
        <p className={labelClass}>Panel público (/p/...)</p>
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            name="publicPanelEnabled"
            defaultChecked={initial.publicPanelEnabled}
            className="h-4 w-4 accent-gold-start"
          />
          Activar panel público sin login
        </label>
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            name="publicShowRanking"
            defaultChecked={initial.publicShowRanking}
            className="h-4 w-4 accent-gold-start"
          />
          Mostrar ranking
        </label>
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            name="publicShowFixture"
            defaultChecked={initial.publicShowFixture}
            className="h-4 w-4 accent-gold-start"
          />
          Mostrar próximos partidos
        </label>
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            name="publicShowPredictions"
            defaultChecked={initial.publicShowPredictions}
            className="h-4 w-4 accent-gold-start"
          />
          Mostrar apuestas de todos en partidos ya jugados
        </label>
      </div>

      <div className="flex flex-col gap-1 border-t border-border-glass pt-4">
        <label htmlFor="showOthersPredictions" className={labelClass}>
          ¿Cuándo ven los miembros las apuestas de los demás?
        </label>
        <select
          id="showOthersPredictions"
          name="showOthersPredictions"
          defaultValue={initial.showOthersPredictions}
          className={inputClass}
        >
          {REVEAL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className={errorClass}>{error}</p>}
      {success && <p className={successClass}>Cambios guardados.</p>}

      <button type="submit" disabled={loading} className={`${buttonClass} self-start`}>
        {loading ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

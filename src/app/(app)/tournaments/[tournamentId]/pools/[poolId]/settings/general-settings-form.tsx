"use client";

import { labelClass, inputClass, buttonClass, errorClass, successClass } from "@/components/ui/form-styles";
import { useSettingsSubmit } from "@/hooks/use-settings-submit";

interface GeneralSettings {
  name: string;
  description: string;
  logo: string;
  accentColor: string;
  welcomeMessage: string;
  rules: string;
}

export function GeneralSettingsForm({ poolId, initial }: { poolId: string; initial: GeneralSettings }) {
  const { submit, loading, error, success } = useSettingsSubmit(`/api/pools/${poolId}/general`);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await submit({
      name: formData.get("name"),
      description: formData.get("description"),
      logo: formData.get("logo"),
      accentColor: formData.get("accentColor"),
      welcomeMessage: formData.get("welcomeMessage"),
      rules: formData.get("rules"),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className={labelClass}>
          Nombre de la polla
        </label>
        <input id="name" name="name" type="text" required minLength={2} defaultValue={initial.name} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className={labelClass}>
          Descripción
        </label>
        <textarea id="description" name="description" rows={2} defaultValue={initial.description} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="logo" className={labelClass}>
          URL del logo
        </label>
        <input id="logo" name="logo" type="text" defaultValue={initial.logo} placeholder="https://..." className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="accentColor" className={labelClass}>
          Color de acento
        </label>
        <div className="flex items-center gap-2">
          <input
            id="accentColor"
            name="accentColor"
            type="color"
            defaultValue={initial.accentColor}
            className="h-10 w-14 cursor-pointer rounded border border-border-glass bg-bg-glass"
          />
          <span className="font-mono text-sm text-text-muted">{initial.accentColor}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="welcomeMessage" className={labelClass}>
          Mensaje de bienvenida
        </label>
        <textarea
          id="welcomeMessage"
          name="welcomeMessage"
          rows={2}
          defaultValue={initial.welcomeMessage}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="rules" className={labelClass}>
          Reglas de la polla (Markdown)
        </label>
        <textarea id="rules" name="rules" rows={5} defaultValue={initial.rules} className={inputClass} />
      </div>

      {error && <p className={errorClass}>{error}</p>}
      {success && <p className={successClass}>Cambios guardados.</p>}

      <button type="submit" disabled={loading} className={`${buttonClass} self-start`}>
        {loading ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

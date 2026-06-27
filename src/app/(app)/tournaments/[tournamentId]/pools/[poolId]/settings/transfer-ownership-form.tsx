"use client";

import { labelClass, inputClass, secondaryButtonClass, errorClass, successClass } from "@/components/ui/form-styles";
import { useSettingsSubmit } from "@/hooks/use-settings-submit";

interface ModeratorOption {
  id: string;
  name: string;
}

export function TransferOwnershipForm({ poolId, moderators }: { poolId: string; moderators: ModeratorOption[] }) {
  const { submit, loading, error, success } = useSettingsSubmit(`/api/pools/${poolId}/transfer-owner`, "POST");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await submit({ newOwnerId: formData.get("newOwnerId") });
  }

  if (moderators.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        Para transferir la propiedad, primero asciende a algún miembro a moderador desde la pestaña Miembros.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="text-sm text-text-muted">
        Conviertes a un moderador en el nuevo OWNER de la polla; tú pasas a ser MODERATOR. Esta acción es inmediata.
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="newOwnerId" className={labelClass}>
          Nuevo OWNER
        </label>
        <select id="newOwnerId" name="newOwnerId" required className={`${inputClass} max-w-sm`}>
          <option value="">Selecciona un moderador</option>
          {moderators.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className={errorClass}>{error}</p>}
      {success && <p className={successClass}>Propiedad transferida. Ahora eres MODERATOR de esta polla.</p>}

      <button type="submit" disabled={loading} className={`${secondaryButtonClass} self-start`}>
        {loading ? "Transfiriendo..." : "Transferir propiedad"}
      </button>
    </form>
  );
}

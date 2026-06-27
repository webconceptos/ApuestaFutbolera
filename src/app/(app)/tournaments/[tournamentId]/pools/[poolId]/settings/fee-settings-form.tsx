"use client";

import { useState } from "react";
import { labelClass, inputClass, buttonClass, errorClass, successClass } from "@/components/ui/form-styles";
import { useSettingsSubmit } from "@/hooks/use-settings-submit";

interface FeeSettings {
  entryFeeEnabled: boolean;
  entryFeeAmount: number;
  entryFeeCurrency: string;
  entryFeeInstructions: string;
  prizeDescription: string;
}

export function FeeSettingsForm({ poolId, initial }: { poolId: string; initial: FeeSettings }) {
  const { submit, loading, error, success } = useSettingsSubmit(`/api/pools/${poolId}/fee`);
  const [enabled, setEnabled] = useState(initial.entryFeeEnabled);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    // Cuando la cuota está desactivada, estos inputs no se renderizan (más
    // abajo) y FormData.get() devuelve null para ellos — el backend exige
    // strings/números válidos siempre, así que se completan con el valor
    // anterior (o un fallback vacío) en vez de mandar null y que el guardado
    // falle por validación.
    await submit({
      entryFeeEnabled: formData.get("entryFeeEnabled") === "on",
      entryFeeAmount: formData.get("entryFeeAmount") ?? initial.entryFeeAmount,
      entryFeeCurrency: formData.get("entryFeeCurrency") ?? initial.entryFeeCurrency,
      entryFeeInstructions: formData.get("entryFeeInstructions") ?? initial.entryFeeInstructions,
      prizeDescription: formData.get("prizeDescription") ?? initial.prizeDescription,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex items-center gap-2 text-sm text-text-primary">
        <input
          type="checkbox"
          name="entryFeeEnabled"
          defaultChecked={initial.entryFeeEnabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 accent-gold-start"
        />
        Esta polla tiene cuota de entrada
      </label>

      {enabled && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="entryFeeAmount" className={labelClass}>
                Monto
              </label>
              <input
                id="entryFeeAmount"
                name="entryFeeAmount"
                type="number"
                min={0}
                step={0.01}
                defaultValue={initial.entryFeeAmount}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="entryFeeCurrency" className={labelClass}>
                Moneda
              </label>
              <input
                id="entryFeeCurrency"
                name="entryFeeCurrency"
                type="text"
                maxLength={10}
                defaultValue={initial.entryFeeCurrency}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="entryFeeInstructions" className={labelClass}>
              Instrucciones de pago
            </label>
            <textarea
              id="entryFeeInstructions"
              name="entryFeeInstructions"
              rows={3}
              defaultValue={initial.entryFeeInstructions}
              placeholder="Yape al 999-999-999 a nombre de..."
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="prizeDescription" className={labelClass}>
              Descripción del premio
            </label>
            <textarea
              id="prizeDescription"
              name="prizeDescription"
              rows={2}
              defaultValue={initial.prizeDescription}
              className={inputClass}
            />
          </div>
        </>
      )}

      {error && <p className={errorClass}>{error}</p>}
      {success && <p className={successClass}>Cambios guardados.</p>}

      <button type="submit" disabled={loading} className={`${buttonClass} self-start`}>
        {loading ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

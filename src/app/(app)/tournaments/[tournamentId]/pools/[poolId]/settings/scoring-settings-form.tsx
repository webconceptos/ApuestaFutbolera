"use client";

import { labelClass, inputClass, buttonClass, secondaryButtonClass, errorClass, successClass } from "@/components/ui/form-styles";
import { useSettingsSubmit } from "@/hooks/use-settings-submit";
import { toDatetimeLocalPeru, peruDatetimeLocalToUtc } from "@/lib/date-peru";
import { TiebreakerEditor } from "./tiebreaker-editor";

interface ScoringSettings {
  predictionDeadlineHours: number;
  pointsExactScore: number;
  pointsCorrectResult: number;
  pointsCorrectGoalDiff: number;
  bonusKnockout: number;
  bonusFinal: number;
  tiebreakerCriteria: string;
  scoringStartDate: string | null;
  scoringEndDate: string | null;
}

export function ScoringSettingsForm({ poolId, initial }: { poolId: string; initial: ScoringSettings }) {
  const { submit, loading, error, success } = useSettingsSubmit(`/api/pools/${poolId}/scoring`);
  const recalc = useSettingsSubmit(`/api/pools/${poolId}/recalculate-ranking`, "POST");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const scoringStartDateInput = formData.get("scoringStartDate") as string;
    const scoringEndDateInput = formData.get("scoringEndDate") as string;
    await submit({
      predictionDeadlineHours: formData.get("predictionDeadlineHours"),
      pointsExactScore: formData.get("pointsExactScore"),
      pointsCorrectResult: formData.get("pointsCorrectResult"),
      pointsCorrectGoalDiff: formData.get("pointsCorrectGoalDiff"),
      bonusKnockout: formData.get("bonusKnockout"),
      bonusFinal: formData.get("bonusFinal"),
      tiebreakerCriteria: formData.get("tiebreakerCriteria"),
      scoringStartDate: scoringStartDateInput ? peruDatetimeLocalToUtc(scoringStartDateInput) : null,
      scoringEndDate: scoringEndDateInput ? peruDatetimeLocalToUtc(scoringEndDateInput) : null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="pointsExactScore" className={labelClass}>
            Marcador exacto
          </label>
          <input
            id="pointsExactScore"
            name="pointsExactScore"
            type="number"
            min={0}
            max={100}
            defaultValue={initial.pointsExactScore}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="pointsCorrectGoalDiff" className={labelClass}>
            Diferencia correcta
          </label>
          <input
            id="pointsCorrectGoalDiff"
            name="pointsCorrectGoalDiff"
            type="number"
            min={0}
            max={100}
            defaultValue={initial.pointsCorrectGoalDiff}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="pointsCorrectResult" className={labelClass}>
            Resultado correcto
          </label>
          <input
            id="pointsCorrectResult"
            name="pointsCorrectResult"
            type="number"
            min={0}
            max={100}
            defaultValue={initial.pointsCorrectResult}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="bonusKnockout" className={labelClass}>
            Multiplicador eliminatorias
          </label>
          <input
            id="bonusKnockout"
            name="bonusKnockout"
            type="number"
            step={0.1}
            min={0}
            max={10}
            defaultValue={initial.bonusKnockout}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="bonusFinal" className={labelClass}>
            Multiplicador final
          </label>
          <input
            id="bonusFinal"
            name="bonusFinal"
            type="number"
            step={0.1}
            min={0}
            max={10}
            defaultValue={initial.bonusFinal}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="predictionDeadlineHours" className={labelClass}>
            Cierre de apuestas (horas antes)
          </label>
          <input
            id="predictionDeadlineHours"
            name="predictionDeadlineHours"
            type="number"
            min={0}
            max={72}
            defaultValue={initial.predictionDeadlineHours}
            className={inputClass}
          />
        </div>
      </div>

      <TiebreakerEditor name="tiebreakerCriteria" initialCsv={initial.tiebreakerCriteria} />

      <div className="flex flex-col gap-3 border-t border-border-glass pt-4">
        <p className="text-sm font-medium text-text-primary">Ventana de puntuación</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="scoringStartDate" className={labelClass}>
              Contar desde (inclusive)
            </label>
            <input
              id="scoringStartDate"
              name="scoringStartDate"
              type="datetime-local"
              defaultValue={initial.scoringStartDate ? toDatetimeLocalPeru(initial.scoringStartDate) : ""}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="scoringEndDate" className={labelClass}>
              Hasta (inclusive)
            </label>
            <input
              id="scoringEndDate"
              name="scoringEndDate"
              type="datetime-local"
              defaultValue={initial.scoringEndDate ? toDatetimeLocalPeru(initial.scoringEndDate) : ""}
              className={inputClass}
            />
          </div>
        </div>
        <p className="text-xs text-text-muted">
          Opcional. Solo los partidos dentro de esta ventana cuentan para el ranking — útil para pollas de semana
          específica o cuando la polla arranca a mitad de torneo. Dejar ambos vacíos para contar todo el torneo.
          Después de cambiar las fechas, recalcula el ranking con el botón de abajo.
        </p>
      </div>

      {error && <p className={errorClass}>{error}</p>}
      {success && <p className={successClass}>Cambios guardados.</p>}

      <button type="submit" disabled={loading} className={`${buttonClass} self-start`}>
        {loading ? "Guardando..." : "Guardar cambios"}
      </button>

      <div className="flex flex-col gap-2 border-t border-border-glass pt-4">
        <p className="text-sm text-text-muted">
          Recalcula los puntos y posiciones de todos los miembros ahora mismo, sin esperar al próximo resultado
          ingresado. Útil después de cambiar la fecha de arranque de arriba.
        </p>
        <button
          type="button"
          disabled={recalc.loading}
          onClick={() => recalc.submit({})}
          className={`${secondaryButtonClass} self-start`}
        >
          {recalc.loading ? "Recalculando..." : "🔄 Recalcular ranking ahora"}
        </button>
        {recalc.error && <p className={errorClass}>{recalc.error}</p>}
        {recalc.success && <p className={successClass}>Ranking recalculado.</p>}
      </div>
    </form>
  );
}

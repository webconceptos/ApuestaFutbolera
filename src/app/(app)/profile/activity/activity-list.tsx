"use client";

import { useMemo, useState } from "react";
import { ClientDate } from "@/components/ui/client-date";

interface ActivityRow {
  id: string;
  action: string;
  createdAt: string;
  entityType: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Inicio de sesión",
  LOGOUT: "Cierre de sesión",
  REGISTER: "Registro",
  PASSWORD_CHANGED: "Cambio de contraseña",
  EMAIL_CHANGED: "Cambio de email",
  PROFILE_UPDATED: "Perfil actualizado",
  AVATAR_UPDATED: "Avatar actualizado",
  POOL_JOINED: "Se unió a una polla",
  POOL_LEFT: "Salió de una polla",
  PREDICTION_CREATED: "Predicción creada",
  PREDICTION_UPDATED: "Predicción editada",
  USER_CREATED: "Usuario creado (admin)",
  USER_UPDATED: "Usuario editado (admin)",
  USER_SUSPENDED: "Usuario suspendido",
  USER_REACTIVATED: "Usuario reactivado",
  USER_ROLE_CHANGED: "Rol cambiado",
  USER_PASSWORD_RESET: "Reset de contraseña (admin)",
  IMPERSONATION_STARTED: "Impersonación iniciada",
  IMPERSONATION_ENDED: "Impersonación finalizada",
  TOURNAMENT_CREATED: "Torneo creado",
  TOURNAMENT_UPDATED: "Torneo editado",
  TOURNAMENT_DELETED: "Torneo eliminado",
  MANAGER_ASSIGNED: "Manager asignado",
  MANAGER_REVOKED: "Manager revocado",
  MATCH_CREATED: "Partido creado",
  MATCH_UPDATED: "Partido editado",
  RESULT_ENTERED: "Resultado ingresado",
  POOL_CREATED: "Polla creada",
  POOL_UPDATED: "Polla editada",
  POOL_DELETED: "Polla eliminada",
  MEMBER_ADDED: "Miembro agregado",
  MEMBER_REMOVED: "Miembro expulsado",
  MEMBER_ROLE_CHANGED: "Rol de miembro cambiado",
  PAYMENT_CONFIRMED: "Pago confirmado",
};

export function ActivityList({ rows }: { rows: ActivityRow[] }) {
  const [filter, setFilter] = useState("ALL");

  const actions = useMemo(() => Array.from(new Set(rows.map((r) => r.action))), [rows]);
  const filtered = filter === "ALL" ? rows : rows.filter((r) => r.action === filter);

  return (
    <div className="flex flex-col gap-4">
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-fit rounded-lg border border-border-glass bg-bg-glass px-3 py-2 text-sm text-text-primary"
      >
        <option value="ALL">Todas las acciones</option>
        {actions.map((action) => (
          <option key={action} value={action}>
            {ACTION_LABELS[action] ?? action}
          </option>
        ))}
      </select>

      {filtered.length === 0 ? (
        <p className="text-sm text-text-muted">Sin actividad registrada.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border-glass">
          {filtered.map((row) => (
            <li key={row.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-text-primary">{ACTION_LABELS[row.action] ?? row.action}</span>
              <span className="text-text-muted">
                <ClientDate iso={row.createdAt} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

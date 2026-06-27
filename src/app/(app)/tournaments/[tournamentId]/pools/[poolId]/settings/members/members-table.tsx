"use client";

import { useState } from "react";
import { MemberRow } from "./member-row";

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  hasPaid: boolean;
  paymentNote: string | null;
  totalPoints: number;
  joinedAt: string;
  isActive: boolean;
}

export function MembersTable({
  poolId,
  members,
  isOwnerView,
  selfUserId,
  entryFeeEnabled,
}: {
  poolId: string;
  members: Member[];
  isOwnerView: boolean;
  selfUserId: string;
  entryFeeEnabled: boolean;
}) {
  const [filter, setFilter] = useState("ALL");

  const filters = [
    { value: "ALL", label: "Todos" },
    ...(entryFeeEnabled ? [{ value: "PENDING", label: "Pago pendiente" }] : []),
    { value: "MODERATORS", label: "Moderadores" },
    { value: "REMOVED", label: "Expulsados" },
  ];

  const filtered = members.filter((m) => {
    if (filter === "PENDING") return !m.hasPaid && m.isActive;
    if (filter === "MODERATORS") return m.role === "MODERATOR";
    if (filter === "REMOVED") return !m.isActive;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              filter === f.value ? "bg-white/10 text-text-primary" : "text-text-muted hover:bg-white/5"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-border-glass text-text-muted">
              <th className="px-4 py-2 font-medium">Miembro</th>
              <th className="px-4 py-2 font-medium">Rol</th>
              {entryFeeEnabled && <th className="px-4 py-2 font-medium">Cuota</th>}
              <th className="px-4 py-2 font-medium">Pts</th>
              <th className="px-4 py-2 font-medium">Unión</th>
              <th className="px-4 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <MemberRow
                key={m.id}
                poolId={poolId}
                memberId={m.id}
                name={m.name}
                email={m.email}
                role={m.role}
                hasPaid={m.hasPaid}
                paymentNote={m.paymentNote}
                totalPoints={m.totalPoints}
                joinedAt={m.joinedAt}
                isActive={m.isActive}
                isOwnerView={isOwnerView}
                isSelf={m.userId === selfUserId}
                entryFeeEnabled={entryFeeEnabled}
              />
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={entryFeeEnabled ? 6 : 5} className="px-4 py-6 text-center text-text-muted">
                  Sin resultados para este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

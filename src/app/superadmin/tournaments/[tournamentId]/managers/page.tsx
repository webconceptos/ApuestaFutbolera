import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { ClientDate } from "@/components/ui/client-date";
import { AssignManagerForm } from "./assign-manager-form";
import { ManagerRow } from "./manager-row";

export default async function ManagersPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;

  const tournament = await db.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) notFound();

  const managers = await db.tournamentManager.findMany({
    where: { tournamentId },
    orderBy: { assignedAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  const assignerIds = Array.from(new Set(managers.map((m) => m.assignedById)));
  const assigners = await db.user.findMany({ where: { id: { in: assignerIds } }, select: { id: true, name: true } });
  const assignerNames = new Map(assigners.map((a) => [a.id, a.name]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-text-primary">Managers · {tournament.shortName}</h1>
        <p className="text-sm text-text-muted">{managers.length} managers asignados</p>
      </div>

      <GlassCard>
        <AssignManagerForm tournamentId={tournamentId} />
      </GlassCard>

      <GlassCard className="overflow-x-auto p-0">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-border-glass text-text-muted">
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Permisos</th>
              <th className="px-4 py-3 font-medium">Asignado por</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {managers.map((m) => (
              <tr key={m.id} className="border-b border-border-glass last:border-0">
                <td className="px-4 py-3">
                  <p className="text-text-primary">{m.user.name}</p>
                  <p className="text-xs text-text-muted">{m.user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <ManagerRow
                    tournamentId={tournamentId}
                    managerId={m.id}
                    canEditMatches={m.canEditMatches}
                    canEnterResults={m.canEnterResults}
                    canCreateMatches={m.canCreateMatches}
                  />
                </td>
                <td className="px-4 py-3 text-text-muted">{assignerNames.get(m.assignedById) ?? "—"}</td>
                <td className="px-4 py-3 text-text-muted">
                  <ClientDate iso={m.assignedAt.toISOString()} />
                </td>
              </tr>
            ))}

            {managers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-text-muted">
                  Sin managers asignados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}

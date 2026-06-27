import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { secondaryButtonClass } from "@/components/ui/form-styles";
import { requirePoolRole } from "@/lib/require-pool-role";
import { MembersTable } from "./members-table";
import { AddMemberForm } from "./add-member-form";
import { InviteActions } from "./invite-actions";
import { PaymentSummaryPanel } from "./payment-summary-panel";

export default async function PoolMembersPage({
  params,
}: {
  params: Promise<{ tournamentId: string; poolId: string }>;
}) {
  const { poolId } = await params;
  const ctx = await requirePoolRole(poolId, ["OWNER", "MODERATOR"]);
  if (!ctx) notFound();

  const pool = await db.pool.findUnique({ where: { id: poolId }, include: { config: true } });
  if (!pool) notFound();

  const members = await db.poolMember.findMany({
    where: { poolId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });

  const activeMembers = members.filter((m) => m.isActive);
  const paidCount = activeMembers.filter((m) => m.hasPaid).length;
  const pendingCount = activeMembers.length - paidCount;

  return (
    <div className="flex flex-col gap-6">
      <GlassCard className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-xl tracking-wide text-text-primary">Invitar participantes</h3>
          <a href={`/api/pools/${poolId}/members/export`} className={secondaryButtonClass}>
            Exportar CSV
          </a>
        </div>
        <InviteActions poolId={poolId} inviteCode={pool.inviteCode} isOwner={ctx.member.role === "OWNER"} />
        <AddMemberForm poolId={poolId} />
      </GlassCard>

      {pool.config?.entryFeeEnabled && (
        <GlassCard>
          <h3 className="mb-2 font-display text-xl tracking-wide text-text-primary">Cuota</h3>
          <PaymentSummaryPanel
            poolId={poolId}
            paidCount={paidCount}
            pendingCount={pendingCount}
            currency={pool.config.entryFeeCurrency}
            amount={pool.config.entryFeeAmount}
          />
        </GlassCard>
      )}

      <GlassCard>
        <MembersTable
          poolId={poolId}
          isOwnerView={ctx.member.role === "OWNER"}
          selfUserId={ctx.session.user.id}
          entryFeeEnabled={pool.config?.entryFeeEnabled ?? false}
          members={members.map((m) => ({
            id: m.id,
            userId: m.userId,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
            hasPaid: m.hasPaid,
            paymentNote: m.paymentNote,
            totalPoints: m.totalPoints,
            joinedAt: m.joinedAt.toISOString(),
            isActive: m.isActive,
          }))}
        />
      </GlassCard>
    </div>
  );
}

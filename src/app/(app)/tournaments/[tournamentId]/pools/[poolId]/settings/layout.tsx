import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePoolRole } from "@/lib/require-pool-role";
import { SettingsTabs } from "./settings-tabs";

export default async function PoolSettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tournamentId: string; poolId: string }>;
}) {
  const { poolId, tournamentId } = await params;
  const ctx = await requirePoolRole(poolId, ["OWNER", "MODERATOR"]);
  if (!ctx) redirect(`/tournaments/${tournamentId}/pools/${poolId}`);

  const pool = await db.pool.findUnique({ where: { id: poolId } });
  if (!pool) notFound();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-text-primary">Configuración · {pool.name}</h1>
        <SettingsTabs tournamentId={tournamentId} poolId={poolId} isOwner={ctx.member.role === "OWNER"} />
      </div>
      {children}
    </div>
  );
}

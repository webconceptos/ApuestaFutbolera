import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { NotificationList } from "./notification-list";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Notification.poolId es un string suelto (sin relación Prisma), así que
  // resolvemos los tournamentId de las pollas involucradas aparte.
  const poolIds = Array.from(new Set(notifications.map((n) => n.poolId).filter((id): id is string => Boolean(id))));
  const pools = poolIds.length
    ? await db.pool.findMany({ where: { id: { in: poolIds } }, select: { id: true, tournamentId: true } })
    : [];
  const tournamentIdByPool = new Map(pools.map((p) => [p.id, p.tournamentId]));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-display text-3xl tracking-wide text-text-primary">Notificaciones</h1>

      <GlassCard>
        <NotificationList
          initial={notifications.map((n) => {
            const tournamentId = n.poolId ? tournamentIdByPool.get(n.poolId) : undefined;
            return {
              id: n.id,
              type: n.type,
              title: n.title,
              message: n.message,
              isRead: n.isRead,
              createdAt: n.createdAt.toISOString(),
              href: n.poolId && tournamentId ? `/tournaments/${tournamentId}/pools/${n.poolId}` : null,
            };
          })}
        />
      </GlassCard>
    </div>
  );
}

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { ActivityList } from "@/app/(app)/profile/activity/activity-list";

export default async function UserActivityPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) notFound();

  // Incluye tanto las acciones propias del usuario como las que un admin haya
  // ejecutado sobre él (ej. USER_SUSPENDED, USER_ROLE_CHANGED, quedan
  // logueadas bajo el userId del admin, con entityId apuntando a este usuario).
  const logs = await db.userActivityLog.findMany({
    where: { OR: [{ userId }, { entityType: "User", entityId: userId }] },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, action: true, createdAt: true, entityType: true },
  });

  return (
    <GlassCard>
      <ActivityList rows={logs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() }))} />
    </GlassCard>
  );
}

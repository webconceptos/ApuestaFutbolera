import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { ActivityList } from "./activity-list";

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const logs = await db.userActivityLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, action: true, createdAt: true, entityType: true },
  });

  return (
    <GlassCard>
      <ActivityList rows={logs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() }))} />
    </GlassCard>
  );
}

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const unreadCount = await db.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return (
    <>
      <ImpersonationBanner />
      <AppShell user={session.user} unreadCount={unreadCount}>
        {children}
      </AppShell>
    </>
  );
}

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { NotifPrefsForm } from "./notif-prefs-form";
import { notifPrefsSchema } from "@/lib/validations/profile";

export default async function NotificationsPrefsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const parsed = notifPrefsSchema.safeParse(user.notifPrefs);

  const initial = parsed.success
    ? parsed.data
    : {
        email: { resultScored: true, rankChange: true, deadlineWarning: true, paymentConfirmed: true },
        inApp: { resultScored: true, rankChange: true, deadlineWarning: true },
      };

  return (
    <GlassCard>
      <NotifPrefsForm initial={initial} />
    </GlassCard>
  );
}

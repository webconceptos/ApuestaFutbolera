import type { NotificationType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/email";

type TogglePrefKey = "resultScored" | "rankChange" | "deadlineWarning" | "paymentConfirmed";

// Solo estos tipos respetan el toggle de /profile/notifications (ver
// notifPrefs en el schema). El resto (ACCOUNT_CREATED, ROLE_CHANGED,
// POOL_INVITE, mensajes CUSTOM de un admin, etc.) son notificaciones
// "críticas" que siempre se crean, tal como indica CLAUDE.md: "las
// notificaciones críticas no se pueden desactivar".
const TYPE_TO_PREF_KEY: Partial<Record<NotificationType, TogglePrefKey>> = {
  RESULT_SCORED: "resultScored",
  RANK_UP: "rankChange",
  RANK_DOWN: "rankChange",
  DEADLINE_WARNING: "deadlineWarning",
  PAYMENT_CONFIRMED: "paymentConfirmed",
};

interface NotifPrefsShape {
  inApp?: Partial<Record<TogglePrefKey, boolean>>;
  email?: Partial<Record<TogglePrefKey, boolean>>;
}

interface NotifyUserParams {
  userId: string;
  poolId?: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Punto único de creación de notificaciones in-app + email. Respeta
 * notifPrefs para los tipos togglable; los demás siempre se crean/envían.
 */
export async function notifyUser({ userId, poolId, type, title, message, metadata }: NotifyUserParams) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, name: true, notifPrefs: true } });
  if (!user) return;

  const prefKey = TYPE_TO_PREF_KEY[type];
  const prefs = (user.notifPrefs as NotifPrefsShape | null) ?? {};

  const inAppAllowed = !prefKey || prefs.inApp?.[prefKey] !== false;
  const emailAllowed = !prefKey || prefs.email?.[prefKey] !== false;

  if (inAppAllowed) {
    await db.notification.create({
      data: { userId, poolId, type, title, message, metadata },
    });
  }

  if (emailAllowed) {
    await sendNotificationEmail({ to: user.email, name: user.name, title, message });
  }
}

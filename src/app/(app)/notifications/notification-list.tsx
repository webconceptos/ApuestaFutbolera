"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClientDate } from "@/components/ui/client-date";
import { secondaryButtonClass } from "@/components/ui/form-styles";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  href: string | null;
}

const TYPE_ICON: Record<string, string> = {
  RESULT_SCORED: "⚽",
  RANK_UP: "📈",
  RANK_DOWN: "📉",
  DEADLINE_WARNING: "⏰",
  PAYMENT_CONFIRMED: "💸",
  WELCOME: "👋",
  POOL_INVITE: "✉️",
  ACCOUNT_CREATED: "🆕",
  ROLE_CHANGED: "🔑",
  CUSTOM: "📣",
};

export function NotificationList({ initial }: { initial: NotificationRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function markRead(id: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isRead: true } : r)));
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    router.refresh();
  }

  async function markAllRead() {
    setLoading(true);
    try {
      setRows((prev) => prev.map((r) => ({ ...r, isRead: true })));
      await fetch("/api/notifications/read-all", { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function handleClick(row: NotificationRow) {
    if (!row.isRead) markRead(row.id);
    if (row.href) router.push(row.href);
  }

  const unreadCount = rows.filter((r) => !r.isRead).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">{unreadCount} sin leer</p>
        {unreadCount > 0 && (
          <button type="button" disabled={loading} onClick={markAllRead} className={secondaryButtonClass}>
            Marcar todas como leídas
          </button>
        )}
      </div>

      <ul className="flex flex-col divide-y divide-border-glass">
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => handleClick(row)}
              className={`flex w-full items-start gap-3 px-1 py-3 text-left transition-colors hover:bg-white/5 ${
                row.isRead ? "" : "bg-white/5"
              }`}
            >
              <span className="text-xl">{TYPE_ICON[row.type] ?? "🔔"}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {!row.isRead && <span className="h-2 w-2 rounded-full bg-gold-start" />}
                  <p className="font-medium text-text-primary">{row.title}</p>
                </div>
                <p className="text-sm text-text-muted">{row.message}</p>
                <p className="mt-1 text-xs text-text-muted">
                  <ClientDate iso={row.createdAt} />
                </p>
              </div>
            </button>
          </li>
        ))}

        {rows.length === 0 && <p className="py-6 text-center text-text-muted">No tienes notificaciones todavía.</p>}
      </ul>
    </div>
  );
}

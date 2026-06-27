"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bell, Menu, LogOut, User as UserIcon, ChevronDown } from "lucide-react";

interface HeaderProps {
  user: { name?: string | null; email?: string | null };
  unreadCount: number;
  onToggleSidebar: () => void;
}

export function Header({ user, unreadCount, onToggleSidebar }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initial = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();

  return (
    <header className="glass-surface sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded p-2 hover:bg-white/5 lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5 text-text-primary" />
        </button>
        <Link href="/dashboard" className="font-display text-2xl tracking-wide text-text-primary">
          Golazo Mundial
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Link href="/notifications" className="relative rounded p-2 hover:bg-white/5" aria-label="Notificaciones">
          <Bell className="h-5 w-5 text-text-primary" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded p-1.5 hover:bg-white/5"
            aria-expanded={menuOpen}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-start/20 text-sm font-semibold text-gold-start">
              {initial}
            </span>
            <span className="hidden text-sm text-text-primary sm:inline">{user.name}</span>
            <ChevronDown className="h-4 w-4 text-text-muted" />
          </button>

          {menuOpen && (
            <div
              className="glass-surface absolute right-0 mt-2 w-52 rounded-xl p-2 shadow-xl"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <p className="truncate px-2 py-1 text-xs text-text-muted">{user.email}</p>
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded px-2 py-2 text-sm text-text-primary hover:bg-white/5"
              >
                <UserIcon className="h-4 w-4" /> Mi perfil
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-error hover:bg-white/5"
              >
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

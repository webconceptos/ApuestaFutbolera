import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { UserDetailTabs } from "./user-detail-tabs";

const ROLE_LABELS: Record<string, string> = {
  USER: "Usuario",
  TOURNAMENT_MANAGER: "Tournament Manager",
  SUPERADMIN: "Superadmin",
};

export default async function UserDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) notFound();

  const initial = user.name.charAt(0).toUpperCase();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-4">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt={user.name} className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-start/20 text-xl font-semibold text-gold-start">
            {initial}
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl tracking-wide text-text-primary">{user.name}</h1>
          <p className="text-sm text-text-muted">
            {user.email} · {ROLE_LABELS[user.role]} ·{" "}
            <span className={user.isActive ? "text-success" : "text-error"}>
              {user.isActive ? "Activo" : "Suspendido"}
            </span>
          </p>
        </div>
      </div>

      <UserDetailTabs userId={userId} />

      {children}
    </div>
  );
}

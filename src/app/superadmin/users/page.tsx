import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { buttonClass, secondaryButtonClass, inputClass } from "@/components/ui/form-styles";
import { ClientDate } from "@/components/ui/client-date";
import { UserRowActions } from "./user-row-actions";

const ROLE_LABELS: Record<string, string> = {
  USER: "Usuario",
  TOURNAMENT_MANAGER: "Tournament Manager",
  SUPERADMIN: "Superadmin",
};

export default async function UsersListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string; sort?: string }>;
}) {
  const session = await auth();
  const { q, role, status, sort } = await searchParams;

  const where: Prisma.UserWhereInput = {};

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
    ];
  }
  if (role && role !== "ALL") where.role = role as Prisma.EnumGlobalRoleFilter["equals"];
  if (status === "active") where.isActive = true;
  if (status === "suspended") where.isActive = false;
  if (status === "unverified") where.isVerified = false;

  const orderBy: Prisma.UserOrderByWithRelationInput =
    sort === "lastLogin" ? { lastLoginAt: "desc" } : sort === "name" ? { name: "asc" } : { createdAt: "desc" };

  const users = await db.user.findMany({
    where,
    orderBy,
    include: { _count: { select: { poolMemberships: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-wide text-text-primary">Usuarios</h1>
        <div className="flex gap-2">
          <a href="/api/superadmin/users/export" className={secondaryButtonClass}>
            Exportar CSV
          </a>
          <Link href="/superadmin/users/import" className={secondaryButtonClass}>
            Importar CSV
          </Link>
          <Link href="/superadmin/users/new" className={buttonClass}>
            + Crear usuario
          </Link>
        </div>
      </div>

      <GlassCard>
        <form method="get" className="flex flex-wrap gap-3">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre, email o username"
            className={`${inputClass} max-w-xs`}
          />
          <select name="role" defaultValue={role ?? "ALL"} className={inputClass}>
            <option value="ALL">Todos los roles</option>
            <option value="USER">Usuario</option>
            <option value="TOURNAMENT_MANAGER">Tournament Manager</option>
            <option value="SUPERADMIN">Superadmin</option>
          </select>
          <select name="status" defaultValue={status ?? "ALL"} className={inputClass}>
            <option value="ALL">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="suspended">Suspendidos</option>
            <option value="unverified">Sin verificar</option>
          </select>
          <select name="sort" defaultValue={sort ?? "createdAt"} className={inputClass}>
            <option value="createdAt">Más recientes</option>
            <option value="lastLogin">Último login</option>
            <option value="name">Nombre</option>
          </select>
          <button type="submit" className={secondaryButtonClass}>
            Filtrar
          </button>
        </form>
      </GlassCard>

      <GlassCard className="overflow-x-auto p-0">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead>
            <tr className="border-b border-border-glass text-text-muted">
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Pollas</th>
              <th className="px-4 py-3 font-medium">Último login</th>
              <th className="px-4 py-3 font-medium">Creado</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border-glass last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/superadmin/users/${u.id}`} className="font-medium text-text-primary hover:underline">
                    {u.name}
                  </Link>
                  <p className="text-xs text-text-muted">{u.email}</p>
                </td>
                <td className="px-4 py-3 text-text-muted">{ROLE_LABELS[u.role]}</td>
                <td className="px-4 py-3">
                  {!u.isActive ? (
                    <span className="text-error">Suspendido</span>
                  ) : !u.isVerified ? (
                    <span className="text-warning">Sin verificar</span>
                  ) : (
                    <span className="text-success">Activo</span>
                  )}
                </td>
                <td className="px-4 py-3 text-text-muted">{u._count.poolMemberships}</td>
                <td className="px-4 py-3 text-text-muted">
                  {u.lastLoginAt ? <ClientDate iso={u.lastLoginAt.toISOString()} /> : "—"}
                </td>
                <td className="px-4 py-3 text-text-muted">
                  <ClientDate iso={u.createdAt.toISOString()} />
                </td>
                <td className="px-4 py-3">
                  <UserRowActions
                    id={u.id}
                    isActive={u.isActive}
                    isSelf={u.id === session?.user.id}
                    canImpersonate={u.role !== "SUPERADMIN"}
                  />
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-text-muted">
                  Sin resultados para este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}

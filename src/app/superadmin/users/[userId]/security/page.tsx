import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { ClientDate } from "@/components/ui/client-date";
import { VerifyToggle } from "./verify-toggle";
import { AdminResetPasswordButton } from "./admin-reset-password-button";

const PROVIDER_LABELS: Record<string, string> = { google: "Google" };

export default async function UserSecurityPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const [user, accounts] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.account.findMany({ where: { userId }, select: { provider: true } }),
  ]);
  if (!user) notFound();

  return (
    <div className="flex flex-col gap-6">
      <GlassCard className="flex flex-col gap-3">
        <h3 className="font-display text-xl tracking-wide text-text-primary">Verificación de email</h3>
        <p className="text-sm text-text-muted">
          Email: <span className={user.isVerified ? "text-success" : "text-warning"}>
            {user.isVerified ? "Verificado" : "Sin verificar"}
          </span>
        </p>
        <VerifyToggle userId={userId} isVerified={user.isVerified} />
      </GlassCard>

      {user.password && (
        <GlassCard>
          <h3 className="mb-3 font-display text-xl tracking-wide text-text-primary">Contraseña</h3>
          <AdminResetPasswordButton userId={userId} />
        </GlassCard>
      )}

      <GlassCard className="flex flex-col gap-2">
        <h3 className="font-display text-xl tracking-wide text-text-primary">Acceso</h3>
        <p className="text-sm text-text-muted">
          Último login:{" "}
          {user.lastLoginAt ? (
            <ClientDate iso={user.lastLoginAt.toISOString()} />
          ) : (
            "nunca"
          )}
          {user.lastLoginIp && ` · IP: ${user.lastLoginIp}`}
        </p>
        <p className="text-sm text-text-muted">
          Cuentas vinculadas:{" "}
          {accounts.length === 0 ? "ninguna" : accounts.map((a) => PROVIDER_LABELS[a.provider] ?? a.provider).join(", ")}
        </p>
      </GlassCard>
    </div>
  );
}

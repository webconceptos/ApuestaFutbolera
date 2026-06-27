import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { ChangePasswordForm } from "./change-password-form";
import { ChangeEmailForm } from "./change-email-form";
import { LinkedAccounts } from "./linked-accounts";
import { SignOutButton } from "./sign-out-button";

export default async function SecurityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [user, accounts] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: session.user.id } }),
    db.account.findMany({ where: { userId: session.user.id }, select: { provider: true } }),
  ]);

  const providers = accounts.map((a) => a.provider);

  return (
    <div className="flex flex-col gap-6">
      {user.password ? (
        <>
          <GlassCard>
            <ChangePasswordForm email={user.email} />
          </GlassCard>
          <GlassCard>
            <ChangeEmailForm currentEmail={user.email} />
          </GlassCard>
        </>
      ) : (
        <GlassCard>
          <p className="text-sm text-text-muted">
            Tu cuenta usa solo inicio de sesión con Google, así que no tiene contraseña ni cambio de email por este
            medio.
          </p>
        </GlassCard>
      )}

      <GlassCard>
        <LinkedAccounts providers={providers} />
      </GlassCard>

      <GlassCard className="flex flex-col gap-3">
        <h3 className="font-display text-xl tracking-wide text-text-primary">Sesión actual</h3>
        <p className="text-sm text-text-muted">
          Las sesiones de Golazo Mundial usan tokens sin estado en el servidor, por lo que todavía no podemos listar tus
          demás dispositivos activos. Si sospechas un acceso indebido, cambia tu contraseña: eso cierra
          automáticamente cualquier otra sesión activa (todas menos esta, que se renueva sola).
        </p>
        <SignOutButton />
      </GlassCard>
    </div>
  );
}

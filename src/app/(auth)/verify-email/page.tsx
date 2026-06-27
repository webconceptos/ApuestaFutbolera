import Link from "next/link";
import { db } from "@/lib/db";
import { linkClass } from "../auth-styles";
import { ResendVerificationForm } from "../resend-verification-form";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <Result title="Enlace inválido" message="Falta el token de verificación." />;
  }

  const user = await db.user.findFirst({ where: { verifyToken: token } });

  if (!user) {
    return (
      <Result title="Enlace inválido" message="Este enlace de verificación no es válido o ya fue usado.">
        <ResendVerificationForm />
      </Result>
    );
  }

  if (!user.verifyTokenExp || user.verifyTokenExp < new Date()) {
    // El reenvío público solo aplica a cuentas nuevas sin verificar. Un
    // cambio de email pendiente requiere sesión activa, así que se repite
    // desde /profile/security en vez de un endpoint público.
    return user.pendingEmail ? (
      <Result title="Enlace expirado" message="Este enlace para confirmar tu cambio de email expiró.">
        <Link href="/profile/security" className={linkClass}>
          Solicitar el cambio de nuevo
        </Link>
      </Result>
    ) : (
      <Result title="Enlace expirado" message="Este enlace de verificación expiró. Solicita uno nuevo.">
        <ResendVerificationForm initialEmail={user.email} />
      </Result>
    );
  }

  // El mismo token se usa para dos flujos: verificar la cuenta nueva, o
  // confirmar un cambio de email pedido desde /profile/security.
  if (user.pendingEmail) {
    const alreadyTaken = await db.user.findUnique({ where: { email: user.pendingEmail } });
    if (alreadyTaken && alreadyTaken.id !== user.id) {
      return <Result title="No se pudo confirmar" message="Ese email ya está en uso por otra cuenta." />;
    }

    await db.user.update({
      where: { id: user.id },
      data: { email: user.pendingEmail, pendingEmail: null, verifyToken: null, verifyTokenExp: null },
    });
    await db.userActivityLog.create({
      data: { userId: user.id, action: "EMAIL_CHANGED", metadata: { from: user.email, to: user.pendingEmail } },
    });

    return (
      <Result title="¡Email actualizado!" message="Tu nuevo email quedó confirmado. Ya puedes iniciar sesión con él.">
        <Link href="/login" className={linkClass}>
          Ir a iniciar sesión
        </Link>
      </Result>
    );
  }

  await db.user.update({
    where: { id: user.id },
    data: { isVerified: true, verifyToken: null, verifyTokenExp: null },
  });

  return (
    <Result title="¡Cuenta verificada!" message="Tu email fue confirmado correctamente. Ya puedes iniciar sesión.">
      <Link href="/login" className={linkClass}>
        Ir a iniciar sesión
      </Link>
    </Result>
  );
}

function Result({ title, message, children }: { title: string; message: string; children?: React.ReactNode }) {
  return (
    <div className="glass-surface flex max-w-sm flex-col gap-3 rounded-2xl p-6">
      <h1 className="font-display text-2xl tracking-wide text-text-primary">{title}</h1>
      <p className="text-text-muted">{message}</p>
      {children}
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { RegisterForm } from "./register-form";
import { linkClass } from "../auth-styles";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string; pool?: string }>;
}) {
  const { invite, pool: poolId } = await searchParams;

  // El panel público (Paso 20) manda acá visitantes anónimos con ?pool=...;
  // si ya tienen sesión (ej. volvieron a hacer click en el link estando
  // logueados), los mandamos directo a unirse en vez de mostrarles el form de
  // registro de nuevo. Esto se resuelve acá (no en el panel público) para que
  // ese panel siga siendo 100% estático/cacheable sin tocar auth().
  if (poolId) {
    const session = await auth();
    if (session?.user) {
      const pool = await db.pool.findUnique({ where: { id: poolId }, select: { inviteCode: true } });
      if (pool) redirect(`/join/${pool.inviteCode}`);
    }
  }

  return (
    <>
      <div>
        <h1 className="font-display text-3xl tracking-wide text-text-primary">Crear cuenta</h1>
        <p className="mt-2 text-text-muted">Únete a Golazo Mundial para empezar a predecir resultados.</p>
        {(invite || poolId) && (
          <p className="mt-2 max-w-sm text-sm text-gold-start">
            Te estás registrando para unirte a una polla. Verifica tu email para continuar y luego usa el link de
            invitación para sumarte.
          </p>
        )}
      </div>
      <RegisterForm />
      <p className="text-sm text-text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className={linkClass}>
          Inicia sesión
        </Link>
      </p>
    </>
  );
}

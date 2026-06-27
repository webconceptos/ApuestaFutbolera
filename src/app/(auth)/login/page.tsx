import Link from "next/link";
import { LoginForm } from "./login-form";
import { linkClass } from "../auth-styles";

function errorMessage(error?: string, code?: string): string | null {
  if (code === "account_suspended") return "Tu cuenta fue suspendida. Contacta al administrador.";
  if (code === "email_not_verified") return "Verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada.";
  if (error === "CredentialsSignin") return "Email o contraseña incorrectos.";
  if (error) return "No se pudo iniciar sesión. Intenta nuevamente.";
  return null;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; code?: string; callbackUrl?: string }>;
}) {
  const { error, code, callbackUrl } = await searchParams;

  return (
    <>
      <div>
        <h1 className="font-display text-3xl tracking-wide text-text-primary">Iniciar sesión</h1>
        <p className="mt-2 text-text-muted">Entra a tu cuenta para ver tus pollas.</p>
      </div>
      <LoginForm callbackUrl={callbackUrl} initialError={errorMessage(error, code)} />
      <p className="text-sm text-text-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className={linkClass}>
          Regístrate
        </Link>
      </p>
    </>
  );
}

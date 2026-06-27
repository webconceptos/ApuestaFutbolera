import { RequestResetForm } from "./request-reset-form";
import { NewPasswordForm } from "./new-password-form";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <>
      <div>
        <h1 className="font-display text-3xl tracking-wide text-text-primary">
          {token ? "Nueva contraseña" : "Recuperar contraseña"}
        </h1>
        <p className="mt-2 text-text-muted">
          {token
            ? "Elige una nueva contraseña para tu cuenta."
            : "Te enviaremos un enlace para restablecer tu contraseña."}
        </p>
      </div>
      {token ? <NewPasswordForm token={token} /> : <RequestResetForm />}
    </>
  );
}

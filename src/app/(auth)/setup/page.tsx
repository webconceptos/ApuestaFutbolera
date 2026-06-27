import { redirect } from "next/navigation";
import { isSetupComplete } from "@/lib/setup";
import { SetupForm } from "./setup-form";

// Con cacheComponents activado (Paso 20), ya es dinámico por defecto.
export default async function SetupPage() {
  if (await isSetupComplete()) {
    redirect("/login");
  }

  return (
    <>
      <div>
        <h1 className="font-display text-3xl tracking-wide text-text-primary">Configuración inicial</h1>
        <p className="mt-2 text-text-muted">Crea la primera cuenta Superadmin para empezar a usar la plataforma.</p>
      </div>
      <SetupForm />
    </>
  );
}

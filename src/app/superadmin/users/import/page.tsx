import { GlassCard } from "@/components/ui/glass-card";
import { UserImportForm } from "./user-import-form";

export default function ImportUsersPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-display text-3xl tracking-wide text-text-primary">Importar usuarios desde CSV</h1>

      <GlassCard>
        <h2 className="font-display text-lg tracking-wide text-text-primary">Formato del archivo</h2>
        <p className="mt-1 text-sm text-text-muted">
          Encabezado opcional. Columnas en este orden: <span className="font-mono">Nombre, Email, Username, Rol</span>.
          Username y Rol son opcionales (Rol por defecto: USER). Valores válidos de Rol:{" "}
          <span className="font-mono">USER</span>, <span className="font-mono">TOURNAMENT_MANAGER</span>,{" "}
          <span className="font-mono">SUPERADMIN</span>.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-bg-glass p-3 text-xs text-text-muted">
{`Nombre,Email,Username,Rol
Juan Pérez,juan@example.com,,USER
María Soto,maria@example.com,mariasoto,TOURNAMENT_MANAGER`}
        </pre>
        <p className="mt-2 text-xs text-text-muted">Máximo 500 filas por archivo. Cada usuario recibe una contraseña temporal generada automáticamente.</p>
      </GlassCard>

      <GlassCard>
        <UserImportForm />
      </GlassCard>
    </div>
  );
}

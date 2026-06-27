import { db } from "@/lib/db";

// El setup se considera completo si ya existe el registro AppSetup, o si por
// alguna razón ya hay usuarios en el sistema (p.ej. se creó el primer
// SUPERADMIN vía /api/auth/register en vez de /setup).
export async function isSetupComplete(): Promise<boolean> {
  const [appSetup, userCount] = await Promise.all([
    db.appSetup.findUnique({ where: { id: "singleton" } }),
    db.user.count(),
  ]);

  return Boolean(appSetup) || userCount > 0;
}

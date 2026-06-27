import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { DeleteAccountForm } from "./delete-account-form";

export default async function DangerPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { token } = await searchParams;

  if (token) {
    const user = await db.user.findFirst({ where: { deleteToken: token } });

    if (!user || !user.deleteTokenExp || user.deleteTokenExp < new Date()) {
      return (
        <GlassCard>
          <p className="text-text-primary">Este enlace de eliminación es inválido o expiró.</p>
        </GlassCard>
      );
    }

    const ownedPool = await db.pool.findFirst({ where: { ownerId: user.id, isActive: true } });
    if (ownedPool) {
      return (
        <GlassCard>
          <p className="text-text-primary">
            Ahora eres OWNER de una polla activa. Transfiérela o elimínala antes de confirmar la baja de tu cuenta.
          </p>
        </GlassCard>
      );
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        isActive: false,
        email: `deleted-${user.id}@deleted.apuestafutbolera.local`,
        deleteToken: null,
        deleteTokenExp: null,
      },
    });

    return (
      <GlassCard>
        <p className="text-text-primary">
          Tu cuenta fue eliminada. Tus datos se conservarán de forma anonimizada por 30 días y luego se borrarán
          definitivamente.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <h3 className="mb-3 font-display text-xl tracking-wide text-error">Eliminar mi cuenta</h3>
      <DeleteAccountForm />
    </GlassCard>
  );
}

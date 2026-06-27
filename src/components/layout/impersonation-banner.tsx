import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { StopImpersonationButton } from "./stop-impersonation-button";

export async function ImpersonationBanner() {
  const session = await auth();
  if (!session?.impersonatedBy) return null;

  const admin = await db.user.findUnique({
    where: { id: session.impersonatedBy },
    select: { name: true },
  });

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-warning px-4 py-2 text-sm font-medium text-black">
      <span>
        {admin?.name ?? "Un Superadmin"} está viendo Golazo Mundial como <strong>{session.user.name}</strong> (
        {session.user.email})
      </span>
      <StopImpersonationButton />
    </div>
  );
}

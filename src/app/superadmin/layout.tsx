import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ParticleBackground } from "@/components/effects/particle-background";
import { SuperadminNav } from "./superadmin-nav";

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    redirect("/login");
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <ParticleBackground />
      <SuperadminNav />
      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}

import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { UserInfoForm } from "./user-info-form";

export default async function UserInfoPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const session = await auth();
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) notFound();

  return (
    <GlassCard>
      <UserInfoForm
        userId={userId}
        isSelf={userId === session?.user.id}
        initial={{
          name: user.name,
          username: user.username ?? "",
          phone: user.phone ?? "",
          bio: user.bio ?? "",
          role: user.role,
          internalNote: user.internalNote ?? "",
        }}
      />
    </GlassCard>
  );
}

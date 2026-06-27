import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { AvatarUploader } from "./avatar-uploader";
import { ProfileInfoForm } from "./profile-info-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUniqueOrThrow({ where: { id: session.user.id } });

  return (
    <GlassCard className="flex flex-col gap-6">
      <AvatarUploader name={user.name} avatarUrl={user.avatarUrl} />
      <ProfileInfoForm
        initial={{
          name: user.name,
          username: user.username ?? "",
          phone: user.phone ?? "",
          bio: user.bio ?? "",
        }}
      />
    </GlassCard>
  );
}

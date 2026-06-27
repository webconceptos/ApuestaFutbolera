import { GlassCard } from "@/components/ui/glass-card";
import { UserCreateForm } from "./user-create-form";

export default function NewUserPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-display text-3xl tracking-wide text-text-primary">Nuevo usuario</h1>
      <GlassCard>
        <UserCreateForm />
      </GlassCard>
    </div>
  );
}

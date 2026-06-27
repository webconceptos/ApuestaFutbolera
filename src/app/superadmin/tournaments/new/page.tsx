import { TournamentForm } from "../tournament-form";
import { GlassCard } from "@/components/ui/glass-card";

export default function NewTournamentPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-display text-3xl tracking-wide text-text-primary">Nuevo torneo</h1>
      <GlassCard>
        <TournamentForm />
      </GlassCard>
    </div>
  );
}

import { GlassCard } from "@/components/ui/glass-card";

export default function PoolNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <GlassCard className="max-w-md text-center">
        <h1 className="font-display text-2xl tracking-wide text-text-primary">Esta polla es privada</h1>
        <p className="mt-2 text-text-muted">
          El panel público no está disponible para esta polla, o el link no es correcto.
        </p>
      </GlassCard>
    </main>
  );
}

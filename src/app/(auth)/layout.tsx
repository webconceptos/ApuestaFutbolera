import { ParticleBackground } from "@/components/effects/particle-background";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <ParticleBackground />
      {children}
    </div>
  );
}

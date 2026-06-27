"use client";

import { useMemo } from "react";
import { ParticlesProvider, Particles } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

// Fondo animado sutil: balones (emoji) y estrellas flotando muy despacio,
// pensado para ir detrás del contenido (z-index negativo, no bloquea clicks).
export function ParticleBackground() {
  const options = useMemo<ISourceOptions>(
    () => ({
      fullScreen: { enable: false },
      background: { color: { value: "transparent" } },
      fpsLimit: 60,
      detectRetina: true,
      particles: {
        number: { value: 28, density: { enable: true, width: 1920, height: 1080 } },
        color: { value: ["#F59E0B", "#F8FAFC", "#94A3B8"] },
        shape: {
          type: ["star", "emoji"],
          options: {
            emoji: { value: "⚽" },
          },
        },
        opacity: { value: { min: 0.08, max: 0.25 } },
        size: { value: { min: 2, max: 6 } },
        move: {
          enable: true,
          speed: { min: 0.2, max: 0.6 },
          direction: "none",
          random: true,
          straight: false,
          outModes: { default: "out" },
        },
        links: { enable: false },
      },
      interactivity: {
        events: { onHover: { enable: false }, onClick: { enable: false } },
      },
    }),
    []
  );

  return (
    <ParticlesProvider init={async (engine) => loadSlim(engine)}>
      <Particles id="tsparticles-bg" className="pointer-events-none fixed inset-0 -z-10" options={options} />
    </ParticlesProvider>
  );
}

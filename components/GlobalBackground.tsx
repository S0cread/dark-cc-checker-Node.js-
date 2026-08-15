"use client";

import Galaxy from "./Galaxy";

export function GlobalBackground() {
  return (
    <div
      className="fixed inset-0 z-0 h-full w-full"
      aria-hidden
    >
      <Galaxy
        mouseRepulsion
        mouseInteraction
        density={1}
        glowIntensity={0.25}
        saturation={0}
        hueShift={140}
        twinkleIntensity={0.2}
        rotationSpeed={0.05}
        repulsionStrength={2}
        autoCenterRepulsion={0}
        starSpeed={0.5}
        speed={0.8}
      />
    </div>
  );
}

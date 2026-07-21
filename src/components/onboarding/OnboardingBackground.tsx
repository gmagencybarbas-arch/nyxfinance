"use client";

import { memo } from "react";
import { motion } from "framer-motion";

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${8 + ((i * 17) % 84)}%`,
  top: `${5 + ((i * 23) % 90)}%`,
  size: 2 + (i % 3),
  delay: (i % 7) * 0.4,
  duration: 4 + (i % 4),
}));

function OnboardingBackgroundBase() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden bg-[var(--background)]" aria-hidden>
      {/* Vinheta */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 45%, transparent 30%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Glow verde Nyx */}
      <motion.div
        className="absolute -left-[30%] top-[10%] h-[55vh] w-[75vw] rounded-full opacity-[0.14] blur-[100px]"
        style={{ background: "radial-gradient(circle, #34d399 0%, transparent 70%)" }}
        animate={{ opacity: [0.1, 0.16, 0.1], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Glow roxo Nyx */}
      <motion.div
        className="absolute -right-[25%] bottom-[5%] h-[60vh] w-[80vw] rounded-full opacity-[0.12] blur-[110px]"
        style={{ background: "radial-gradient(circle, #a78bfa 0%, transparent 65%)" }}
        animate={{ opacity: [0.08, 0.15, 0.08], scale: [1.02, 1, 1.02] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Centro sutil */}
      <div
        className="absolute left-1/2 top-[35%] h-[40vh] w-[60vw] -translate-x-1/2 rounded-full opacity-[0.06] blur-[80px]"
        style={{ background: "var(--nyx-gradient-start)" }}
      />

      {/* Grid discreto */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 90% 80% at 50% 40%, black 20%, transparent 75%)",
        }}
      />

      {/* Partículas */}
      {PARTICLES.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-white/30"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size }}
          animate={{ opacity: [0.15, 0.5, 0.15], y: [0, -12, 0] }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export const OnboardingBackground = memo(OnboardingBackgroundBase);

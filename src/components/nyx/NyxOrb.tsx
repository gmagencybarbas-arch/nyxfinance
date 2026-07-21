"use client";

import { motion } from "framer-motion";
import type { NyxState } from "./types";

interface NyxOrbProps {
  state: NyxState;
  size?: number;
  className?: string;
}

export function NyxOrb({ state, size = 110, className = "" }: NyxOrbProps) {
  const isActive = state === "listening" || state === "speaking" || state === "thinking";
  const isListening = state === "listening";

  return (
    <motion.div
      className={`relative flex items-center justify-center ${className}`}
      animate={{
        scale: isActive ? 1.08 : 1,
      }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Glow externo - mais visível mas elegante */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size + 100,
          height: size + 100,
          background:
            "radial-gradient(circle, var(--nyx-glow) 0%, transparent 65%)",
          filter: "blur(28px)",
        }}
        animate={{
          opacity: isActive ? 0.9 : 0.5,
          scale: isListening ? 1.15 : 1,
        }}
        transition={{ duration: 0.4 }}
      />
      {/* Glow secundário (verde) */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size + 50,
          height: size + 50,
          background:
            "radial-gradient(circle, var(--nyx-glow-strong) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
        animate={{
          opacity: isActive ? 0.7 : 0.25,
        }}
        transition={{ duration: 0.4 }}
      />
      {/* Orb principal */}
      <motion.div
        className="relative rounded-full overflow-hidden"
        style={{
          width: size,
          height: size,
          background: `linear-gradient(135deg, var(--nyx-gradient-start) 0%, var(--nyx-gradient-mid) 40%, var(--nyx-gradient-end) 100%)`,
          boxShadow: `
            0 0 48px var(--nyx-glow),
            0 0 96px rgba(34, 197, 94, 0.22),
            inset 0 0 60px rgba(255,255,255,0.12)
          `,
        }}
        animate={{
          scale: [1, 1.025, 1],
          rotate: isActive ? [0, 4, -4, 0] : 0,
        }}
        transition={{
          scale: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 2.2, repeat: isActive ? Infinity : 0 },
        }}
        whileHover={{ scale: 1.05 }}
      >
        {isListening && (
          <motion.div
            className="absolute inset-0 rounded-full bg-white/25"
            animate={{ opacity: [0.3, 0.65, 0.3] }}
            transition={{ duration: 0.7, repeat: Infinity }}
          />
        )}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 50%)",
          }}
        />
      </motion.div>
    </motion.div>
  );
}

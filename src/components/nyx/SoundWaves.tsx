"use client";

import { motion } from "framer-motion";
import type { NyxState } from "./types";

interface SoundWavesProps {
  state: NyxState;
  barCount?: number;
}

/** Altura base + variação orgânica por barra */
function getBarHeights(base: number[], variance: number, barIndex: number) {
  const seed = (barIndex * 0.17 + 1) % 1;
  return base.map((h) => Math.max(4, h + (seed - 0.5) * variance * 2));
}

export function SoundWaves({ state, barCount = 12 }: SoundWavesProps) {
  const isListening = state === "listening";
  const isSpeaking = state === "speaking";

  return (
    <motion.div
      className="flex items-end justify-center gap-1 h-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {Array.from({ length: barCount }).map((_, i) => {
        const listeningHeights = getBarHeights([8, 30, 12, 34, 8], 5, i);
        const speakingHeights = getBarHeights([8, 20, 14, 24, 8], 3, i);

        const animate =
          isListening
            ? {
                height: listeningHeights,
                opacity: [0.65, 1, 0.65, 1, 0.65],
                transition: {
                  duration: 0.28,
                  repeat: Infinity,
                  delay: i * 0.04,
                  ease: [0.4, 0, 0.6, 1] as const,
                },
              }
            : isSpeaking
              ? {
                  height: speakingHeights,
                  opacity: [0.5, 0.9, 0.5, 0.9, 0.5],
                  transition: {
                    duration: 0.55,
                    repeat: Infinity,
                    delay: i * 0.06,
                    ease: [0.4, 0, 0.6, 1] as const,
                  },
                }
              : {
                  height: 8,
                  opacity: 0.4,
                  transition: { duration: 0.25 },
                };

        return (
          <motion.div
            key={i}
            className="w-1.5 rounded-full bg-gradient-to-t from-[var(--nyx-gradient-end)] to-[var(--nyx-gradient-start)]"
            animate={animate}
            style={{ originY: 1 }}
          />
        );
      })}
    </motion.div>
  );
}

"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { NyxOrb } from "@/components/nyx";

const CONFETTI = Array.from({ length: 32 }, (_, i) => ({
  id: i,
  x: ((i * 41) % 200) - 100,
  y: -60 - (i % 8) * 18,
  rotate: (i * 47) % 360,
  color: i % 3 === 0 ? "#34d399" : i % 3 === 1 ? "#a78bfa" : "#fbbf24",
  delay: (i % 10) * 0.04,
}));

interface CompletionScreenProps {
  onFinish: () => void;
}

export function CompletionScreen({ onFinish }: CompletionScreenProps) {
  useEffect(() => {
    const id = window.setTimeout(() => {}, 1500);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="relative flex flex-col items-center overflow-hidden text-center">
      {CONFETTI.map((p) => (
        <motion.span
          key={p.id}
          className="pointer-events-none absolute left-1/2 top-[38%] h-1.5 w-3 rounded-sm"
          style={{ background: p.color }}
          initial={{ opacity: 0, x: 0, y: 0, rotate: 0 }}
          animate={{
            opacity: [0, 1, 0.8, 0],
            x: p.x,
            y: p.y,
            rotate: p.rotate,
          }}
          transition={{ duration: 1.4, delay: p.delay, ease: "easeOut" }}
        />
      ))}

      <motion.div
        className="absolute left-1/2 top-[30%] h-48 w-48 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, #a78bfa, #34d399)" }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
      >
        <NyxOrb state="speaking" size={112} className="mx-auto" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="relative mt-10 max-w-sm space-y-3"
      >
        <h2 className="text-2xl font-bold leading-tight tracking-tight text-[var(--foreground)] sm:text-3xl">
          Perfeito.
          <br />
          Agora eu já consigo enxergar seu futuro financeiro.
        </h2>
        <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
          Quanto mais você conversar comigo, mais inteligente eu fico.
        </p>
      </motion.div>

      <motion.button
        type="button"
        onClick={onFinish}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        whileTap={{ scale: 0.98 }}
        className="relative mt-10 w-full max-w-sm rounded-2xl bg-gradient-to-r from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] py-4 text-sm font-semibold text-white shadow-[0_0_40px_rgba(167,139,250,0.45)]"
      >
        Entrar na Nyx
      </motion.button>
    </div>
  );
}

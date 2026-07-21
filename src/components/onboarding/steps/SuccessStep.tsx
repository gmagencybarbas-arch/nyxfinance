"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { NyxOrb } from "@/components/nyx";

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: ((i * 37) % 100) - 50,
  delay: (i % 6) * 0.05,
  color: i % 2 === 0 ? "var(--nyx-gradient-start)" : "var(--nyx-gradient-end)",
}));

interface SuccessStepProps {
  onFinish: () => void;
}

export function SuccessStep({ onFinish }: SuccessStepProps) {
  useEffect(() => {
    const id = window.setTimeout(() => {
      /* confetti auto-settles */
    }, 1200);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="relative space-y-8 overflow-hidden text-center">
      {PARTICLES.map((p) => (
        <motion.span
          key={p.id}
          className="pointer-events-none absolute left-1/2 top-1/3 h-2 w-2 rounded-full"
          style={{ background: p.color }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            x: p.x * 2,
            y: -80 - (p.id % 5) * 20,
            scale: [0, 1.2, 0.4],
          }}
          transition={{ duration: 1.2, delay: p.delay, ease: "easeOut" }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className="relative"
      >
        <NyxOrb state="speaking" size={100} className="mx-auto" />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 400, damping: 18 }}
          className="absolute -bottom-1 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_24px_rgba(34,197,94,0.5)]"
        >
          <Check className="h-5 w-5 text-white" strokeWidth={3} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="space-y-3"
      >
        <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          Pronto. Seu futuro financeiro já começou a aparecer.
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          A partir de agora, a Nyx usa isso no seu Planejamento.
        </p>
      </motion.div>

      <motion.button
        type="button"
        onClick={onFinish}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full rounded-xl bg-gradient-to-r from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] py-3.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(167,139,250,0.35)]"
      >
        Entrar na Nyx
      </motion.button>
    </div>
  );
}

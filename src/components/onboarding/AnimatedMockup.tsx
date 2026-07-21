"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

const PHRASE = "Gastei R$45 no mercado.";

const FIELDS = [
  { label: "Alimentação", delay: 0 },
  { label: "R$ 45", delay: 0.12 },
  { label: "Hoje", delay: 0.24 },
  { label: "Registrado", delay: 0.36, accent: true },
] as const;

type Phase = "phrase" | "transform" | "result";

export function AnimatedMockup() {
  const [phase, setPhase] = useState<Phase>("phrase");

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase("transform"), 2200);
    const t2 = window.setTimeout(() => setPhase("result"), 3200);
    const t3 = window.setTimeout(() => setPhase("phrase"), 7000);
    const loop = window.setInterval(() => {
      setPhase("phrase");
      window.setTimeout(() => setPhase("transform"), 2200);
      window.setTimeout(() => setPhase("result"), 3200);
    }, 7000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearInterval(loop);
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div
        className="absolute -inset-4 rounded-3xl opacity-40 blur-2xl"
        style={{ background: "radial-gradient(circle, rgba(167,139,250,0.35), transparent 70%)" }}
        aria-hidden
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[var(--card)]/60 p-5 backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted-foreground)]">
            Nyx processando
          </span>
        </div>

        <AnimatePresence mode="wait">
          {phase !== "result" ? (
            <motion.p
              key="phrase"
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: phase === "transform" ? 0.4 : 1,
                y: 0,
                scale: phase === "transform" ? 0.95 : 1,
                filter: phase === "transform" ? "blur(2px)" : "blur(0px)",
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="text-center text-lg font-medium text-[var(--foreground)]"
            >
              &ldquo;{PHRASE}&rdquo;
            </motion.p>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {FIELDS.map((field) => (
                <motion.div
                  key={field.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: field.delay, duration: 0.35 }}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${
                    field.accent
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-white/[0.08] bg-white/[0.04]"
                  }`}
                >
                  <Check
                    className={`h-4 w-4 shrink-0 ${field.accent ? "text-emerald-400" : "text-[var(--nyx-gradient-start)]"}`}
                    strokeWidth={2.5}
                  />
                  <span className="text-sm font-medium text-[var(--foreground)]">{field.label}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

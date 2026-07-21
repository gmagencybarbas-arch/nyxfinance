"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

const MOCK_ITEMS = [
  { label: "Hoje", amount: null, type: "anchor" as const },
  { label: "Mercado", amount: "R$ 45", type: "expense" as const },
  { label: "Aluguel", amount: "R$ 1.800", type: "bill" as const },
  { label: "Notebook", amount: "3/10", type: "installment" as const },
  { label: "Livre estimado", amount: "R$ 2.340", type: "free" as const },
];

const STEP_MS = 850;

interface AnimatedTimelineProps {
  onSequenceComplete?: () => void;
}

export function AnimatedTimeline({ onSequenceComplete }: AnimatedTimelineProps) {
  const [revealed, setRevealed] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    setRevealed(0);
    completedRef.current = false;
  }, []);

  useEffect(() => {
    if (revealed >= MOCK_ITEMS.length) {
      if (!completedRef.current) {
        completedRef.current = true;
        onSequenceComplete?.();
      }
      return;
    }
    const id = window.setTimeout(() => setRevealed((n) => n + 1), STEP_MS);
    return () => window.clearTimeout(id);
  }, [revealed, onSequenceComplete]);

  return (
    <div className="relative mx-auto w-full max-w-xs">
      <div
        className="absolute -inset-6 rounded-3xl opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.4), transparent 65%)" }}
        aria-hidden
      />

      <div className="relative rounded-2xl border border-white/[0.1] bg-[var(--card)]/70 p-4 backdrop-blur-xl">
        <p className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
          Seu planejamento
        </p>

        <div className="space-y-1">
          {MOCK_ITEMS.map((item, i) => {
            const visible = i < revealed;
            const isActive = i === revealed - 1;
            const isFree = item.type === "free";

            return (
              <div key={item.label}>
                <motion.div
                  initial={false}
                  animate={{
                    opacity: visible ? 1 : 0.15,
                    x: visible ? 0 : 12,
                    scale: isActive ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
                    isFree && visible
                      ? "border border-emerald-500/35 bg-emerald-500/10 shadow-[0_0_24px_rgba(52,211,153,0.12)]"
                      : visible
                        ? "border border-white/[0.08] bg-white/[0.04]"
                        : "border border-transparent"
                  }`}
                  style={
                    isActive
                      ? { boxShadow: "0 0 20px rgba(167,139,250,0.2)" }
                      : undefined
                  }
                >
                  <span
                    className={`text-sm font-medium ${
                      isFree && visible ? "text-emerald-300" : "text-[var(--foreground)]"
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.amount && (
                    <span
                      className={`text-sm tabular-nums ${
                        isFree ? "font-bold text-emerald-400" : "text-[var(--muted-foreground)]"
                      }`}
                    >
                      {item.amount}
                    </span>
                  )}
                </motion.div>

                {i < MOCK_ITEMS.length - 1 && (
                  <motion.div
                    className="flex justify-center py-0.5"
                    animate={{ opacity: visible && i < revealed - 1 ? 1 : 0.2 }}
                  >
                    <ArrowDown
                      className={`h-3.5 w-3.5 ${
                        visible && i < revealed - 1
                          ? "text-[var(--nyx-gradient-start)] drop-shadow-[0_0_6px_rgba(167,139,250,0.8)]"
                          : "text-[var(--muted-foreground)]"
                      }`}
                    />
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

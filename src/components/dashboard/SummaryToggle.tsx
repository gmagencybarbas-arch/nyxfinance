"use client";

import { motion } from "framer-motion";

export type SummaryMode = "month" | "year";

interface SummaryToggleProps {
  value: SummaryMode;
  onChange: (v: SummaryMode) => void;
}

export function SummaryToggle({ value, onChange }: SummaryToggleProps) {
  return (
    <motion.div
      className="relative flex rounded-xl bg-white/[0.06] p-1 backdrop-blur border border-white/[0.06]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        layoutId="summary-toggle-glow"
        className="absolute inset-y-1 w-[calc(50%-4px)] rounded-lg bg-gradient-to-r from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] shadow-[0_0_12px_rgba(167,139,250,0.3)]"
        animate={{ left: value === "month" ? 4 : "50%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
      <button
        type="button"
        onClick={() => onChange("month")}
        className={`relative z-10 flex-1 py-2.5 text-sm font-medium transition rounded-lg ${
          value === "month"
            ? "text-white"
            : "text-white/50 hover:text-white/80"
        }`}
      >
        Resumo do mês
      </button>
      <button
        type="button"
        onClick={() => onChange("year")}
        className={`relative z-10 flex-1 py-2.5 text-sm font-medium transition rounded-lg ${
          value === "year"
            ? "text-white"
            : "text-white/50 hover:text-white/80"
        }`}
      >
        Resumo do ano
      </button>
    </motion.div>
  );
}

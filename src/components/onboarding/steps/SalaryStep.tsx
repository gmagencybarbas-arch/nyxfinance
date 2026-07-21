"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { QuestionCard } from "../QuestionCard";

const OPTIONS: { value: string; label: string }[] = [
  { value: "ate_1k", label: "Até R$ 1.000" },
  { value: "1k_3k", label: "R$ 1.000 – R$ 3.000" },
  { value: "3k_5k", label: "R$ 3.000 – R$ 5.000" },
  { value: "5k_10k", label: "R$ 5.000 – R$ 10.000" },
  { value: "10k_20k", label: "R$ 10.000 – R$ 20.000" },
  { value: "20k_plus", label: "Acima de R$ 20.000" },
];

interface SalaryStepProps {
  value: string;
  onChange: (v: string) => void;
}

function SalaryStepBase({ value, onChange }: SalaryStepProps) {
  return (
    <QuestionCard>
      <div className="space-y-2">
        {OPTIONS.map((opt, i) => (
          <motion.button
            key={opt.value}
            type="button"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onChange(opt.value)}
            className={`w-full rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-all ${
              value === opt.value
                ? "border-[var(--nyx-gradient-start)]/60 bg-[var(--nyx-gradient-start)]/12 text-[var(--foreground)] shadow-[0_0_20px_rgba(167,139,250,0.12)]"
                : "border-white/[0.08] bg-white/[0.03] text-[var(--foreground)] hover:border-white/[0.15]"
            }`}
            whileTap={{ scale: 0.99 }}
          >
            {opt.label}
          </motion.button>
        ))}
      </div>
    </QuestionCard>
  );
}

export const SalaryStep = memo(SalaryStepBase);

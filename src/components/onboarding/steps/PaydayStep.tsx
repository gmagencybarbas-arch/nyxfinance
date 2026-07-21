"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { QuestionCard } from "../QuestionCard";

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

interface PaydayStepProps {
  value: number;
  onChange: (v: number) => void;
}

function PaydayStepBase({ value, onChange }: PaydayStepProps) {
  return (
    <QuestionCard>
      <div className="grid max-h-48 grid-cols-5 gap-2 overflow-y-auto pr-1 sm:grid-cols-7">
        {DAYS.map((d) => (
          <motion.button
            key={d}
            type="button"
            onClick={() => onChange(d)}
            className={`aspect-square rounded-xl text-sm font-semibold transition-all ${
              value === d
                ? "bg-gradient-to-br from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] text-white shadow-[0_0_16px_rgba(167,139,250,0.4)]"
                : "border border-white/[0.08] bg-white/[0.03] text-[var(--foreground)] hover:border-white/[0.15]"
            }`}
            whileTap={{ scale: 0.94 }}
          >
            {d}
          </motion.button>
        ))}
      </div>
    </QuestionCard>
  );
}

export const PaydayStep = memo(PaydayStepBase);

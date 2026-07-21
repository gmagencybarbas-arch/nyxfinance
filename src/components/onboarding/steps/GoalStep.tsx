"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui";
import { GOAL_PRESETS } from "../types";
import { QuestionCard } from "../QuestionCard";

interface GoalStepProps {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

function GoalStepBase({ value, onChange, error }: GoalStepProps) {
  return (
    <QuestionCard>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {GOAL_PRESETS.map((preset, i) => (
            <motion.button
              key={preset}
              type="button"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onChange(preset)}
              className={`rounded-full border px-3.5 py-2 text-xs font-medium transition ${
                value === preset
                  ? "border-[var(--nyx-gradient-start)] bg-[var(--nyx-gradient-start)]/15 text-[var(--foreground)]"
                  : "border-white/[0.08] bg-white/[0.03] text-[var(--muted-foreground)] hover:border-white/[0.15]"
              }`}
              whileTap={{ scale: 0.97 }}
            >
              {preset}
            </motion.button>
          ))}
        </div>
        <Input
          placeholder="Ou escreva sua meta…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={error}
          className="text-base"
        />
      </div>
    </QuestionCard>
  );
}

export const GoalStep = memo(GoalStepBase);

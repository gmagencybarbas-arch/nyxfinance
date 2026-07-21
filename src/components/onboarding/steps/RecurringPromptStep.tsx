"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface RecurringPromptStepProps {
  onLaunch: () => void;
  onSkip: () => void;
}

function RecurringPromptStepBase({ onLaunch, onSkip }: RecurringPromptStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col justify-center space-y-6"
    >
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-white/[0.1] bg-gradient-to-br from-[var(--nyx-gradient-start)]/20 to-emerald-500/10 shadow-[0_0_40px_rgba(167,139,250,0.15)]">
        <RefreshCw className="h-9 w-9 text-[var(--nyx-gradient-start)]" />
      </div>

      <div className="flex flex-col gap-3">
        <motion.button
          type="button"
          onClick={onLaunch}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-2xl bg-gradient-to-r from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] py-4 text-sm font-semibold text-white shadow-[0_0_32px_rgba(167,139,250,0.4)]"
        >
          Lançar primeiro gasto fixo
        </motion.button>
        <button
          type="button"
          onClick={onSkip}
          className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] py-3.5 text-sm font-medium text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
        >
          Fazer depois
        </button>
      </div>
    </motion.div>
  );
}

export const RecurringPromptStep = memo(RecurringPromptStepBase);

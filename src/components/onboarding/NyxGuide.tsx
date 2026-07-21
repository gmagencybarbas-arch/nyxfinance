"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { NyxOrb } from "@/components/nyx";
import type { NyxState } from "@/components/nyx/types";

interface NyxGuideProps {
  message: string;
  orbState?: NyxState;
  compact?: boolean;
}

function NyxGuideBase({ message, orbState = "speaking", compact }: NyxGuideProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex shrink-0 items-start gap-3 ${compact ? "mb-4" : "mb-6"}`}
    >
      <div className="shrink-0">
        <NyxOrb state={orbState} size={compact ? 44 : 52} />
      </div>
      <div className="min-w-0 flex-1 pt-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--nyx-gradient-start)]">
          Nyx
        </p>
        <p className="mt-1 text-[15px] leading-snug text-[var(--foreground)] sm:text-base">
          &ldquo;{message}&rdquo;
        </p>
      </div>
    </motion.div>
  );
}

export const NyxGuide = memo(NyxGuideBase);

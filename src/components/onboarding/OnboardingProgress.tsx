"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { OnboardingStepId } from "./types";
import { PROFILE_STEP_IDS } from "./types";
import {
  COMPLETION_META,
  ONBOARDING_TOTAL_PHASES,
  getProfileSubProgress,
  getStepMeta,
} from "./onboardingConfig";

interface OnboardingProgressProps {
  currentStep: OnboardingStepId;
  isCompletion?: boolean;
}

function OnboardingProgressBase({ currentStep, isCompletion }: OnboardingProgressProps) {
  const meta = isCompletion ? COMPLETION_META : getStepMeta(currentStep);
  const profileSub = getProfileSubProgress(currentStep);

  let percent = meta.progressPercent;
  if (profileSub !== null) {
    const base = 50;
    const span = 33;
    percent = base + (profileSub / 100) * span;
  }

  return (
    <div className="shrink-0 space-y-2.5 px-1">
      <div className="flex items-end justify-between gap-3">
        <p className="text-xs font-medium text-[var(--foreground)]">{meta.phaseLabel}</p>
        <p className="shrink-0 text-[10px] tabular-nums text-[var(--muted-foreground)]">
          Passo {meta.phaseStep} de {ONBOARDING_TOTAL_PHASES}
        </p>
      </div>

      <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 via-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)]"
          style={{ boxShadow: "0 0 20px rgba(167,139,250,0.45)" }}
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 22 }}
        />
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-white/20"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 22 }}
          style={{ mixBlendMode: "overlay" }}
        />
      </div>

      {PROFILE_STEP_IDS.includes(currentStep) && (
        <div className="flex gap-1">
          {PROFILE_STEP_IDS.map((id) => (
            <div
              key={id}
              className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                PROFILE_STEP_IDS.indexOf(id) <= PROFILE_STEP_IDS.indexOf(currentStep)
                  ? "bg-[var(--nyx-gradient-start)]/70"
                  : "bg-white/[0.08]"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const OnboardingProgress = memo(OnboardingProgressBase);

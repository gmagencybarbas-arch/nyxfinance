"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";

interface OnboardingStepProps {
  stepId: string;
  direction: number;
  children: ReactNode;
}

export function OnboardingStep({ stepId, direction, children }: OnboardingStepProps) {
  return (
    <motion.div
      key={stepId}
      initial={{ opacity: 0, x: direction * 40, filter: "blur(8px)", scale: 0.97 }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)", scale: 1 }}
      exit={{ opacity: 0, x: direction * -40, filter: "blur(8px)", scale: 0.97 }}
      transition={{ duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

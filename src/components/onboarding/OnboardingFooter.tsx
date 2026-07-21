"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui";

interface OnboardingFooterProps {
  children: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  showSkip?: boolean;
  onSkip?: () => void;
  className?: string;
}

export function OnboardingFooter({
  children,
  showBack,
  onBack,
  showSkip,
  onSkip,
  className = "",
}: OnboardingFooterProps) {
  return (
    <footer className={`space-y-3 ${className}`}>
      <div className="flex gap-3">
        {showBack && onBack && (
          <Button variant="ghost" size="md" onClick={onBack} className="flex-1">
            Voltar
          </Button>
        )}
        {children}
      </div>
      {showSkip && onSkip && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkip}
          className="w-full text-[var(--muted-foreground)]"
        >
          Pular por enquanto
        </Button>
      )}
    </footer>
  );
}

interface PrimaryCtaProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pulse?: boolean;
  dimmed?: boolean;
  className?: string;
}

export function OnboardingPrimaryCta({
  label,
  onClick,
  disabled,
  pulse,
  dimmed,
  className = "",
}: PrimaryCtaProps) {
  return (
    <motion.div
      className={`flex-1 ${className}`}
      animate={pulse ? { scale: [1, 1.04, 1] } : { scale: 1 }}
      transition={
        pulse
          ? { duration: 0.7, repeat: Infinity, repeatDelay: 0.9, ease: "easeInOut" }
          : { duration: 0.2 }
      }
    >
      <Button
        variant="primary"
        size="md"
        onClick={onClick}
        disabled={disabled}
        className={`w-full rounded-2xl py-3.5 text-sm font-semibold ${
          pulse
            ? "shadow-[0_0_32px_rgba(167,139,250,0.55)] ring-2 ring-[var(--nyx-gradient-start)]/40"
            : dimmed
              ? "opacity-60"
              : "shadow-[0_0_24px_rgba(167,139,250,0.2)]"
        }`}
      >
        {label}
      </Button>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

export type CommitmentBarSeverity = "info" | "positive" | "warning" | "danger" | "neutral";

export interface CommitmentBarProps {
  /** 0–100 */
  value: number;
  severity?: CommitmentBarSeverity;
  animated?: boolean;
  showPercentage?: boolean;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

const GRADIENT: Record<CommitmentBarSeverity, string> = {
  positive:
    "bg-gradient-to-r from-emerald-500/85 via-[var(--nyx-gradient-end)] to-[var(--nyx-gradient-end)]",
  info: "bg-gradient-to-r from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)]",
  warning: "bg-gradient-to-r from-amber-400/90 to-orange-500/85",
  danger: "bg-gradient-to-r from-red-500/90 to-rose-500/85",
  neutral: "bg-gradient-to-r from-[var(--nyx-gradient-start)]/80 to-[var(--nyx-gradient-end)]/80",
};

const GLOW: Record<CommitmentBarSeverity, string> = {
  positive: "group-hover:shadow-[0_0_18px_rgba(52,211,153,0.25)]",
  info: "group-hover:shadow-[0_0_18px_rgba(139,92,246,0.22)]",
  warning: "group-hover:shadow-[0_0_18px_rgba(251,191,36,0.22)]",
  danger: "group-hover:shadow-[0_0_18px_rgba(248,113,113,0.25)]",
  neutral: "group-hover:shadow-[0_0_16px_rgba(139,92,246,0.18)]",
};

const HEIGHT = { sm: "h-1.5", md: "h-2.5" } as const;

export function commitmentSeverityFromPercent(value: number): CommitmentBarSeverity {
  const v = Math.min(100, Math.max(0, value));
  if (v >= 90) return "danger";
  if (v >= 75) return "warning";
  if (v >= 45) return "info";
  return "positive";
}

/** Pressão = comprometido / receita prevista. */
export function pressurePercent(committed: number, expectedIncome: number): number {
  if (expectedIncome <= 0) return committed > 0 ? 100 : 0;
  return Math.min(100, Math.round((committed / expectedIncome) * 100));
}

export function CommitmentBar({
  value,
  severity: severityProp,
  animated = true,
  showPercentage = false,
  label,
  size = "md",
  className = "",
}: CommitmentBarProps) {
  const pct = useMemo(() => Math.min(100, Math.max(0, value)), [value]);
  const severity = severityProp ?? commitmentSeverityFromPercent(pct);
  const showHeader = Boolean(label || showPercentage);

  return (
    <div className={`group ${className}`}>
      {showHeader && (
        <div className="mb-2 flex items-center justify-between gap-3 text-xs">
          {label ? (
            <span className="font-medium text-[var(--muted-foreground)]">{label}</span>
          ) : (
            <span />
          )}
          {showPercentage && (
            <span className="tabular-nums font-semibold tracking-tight text-[var(--foreground)]">
              {Math.round(pct)}%
            </span>
          )}
        </div>
      )}

      <motion.div
        className={[
          "relative w-full overflow-hidden rounded-full bg-[var(--muted)]/70",
          "ring-1 ring-inset ring-white/[0.06]",
          "transition-[box-shadow,ring-color] duration-300 ease-out",
          GLOW[severity],
          "group-hover:ring-white/10",
          HEIGHT[size],
        ].join(" ")}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <motion.div
          className={[
            "absolute inset-y-0 left-0 rounded-full",
            GRADIENT[severity],
            "transition-[filter] duration-300 group-hover:brightness-110",
          ].join(" ")}
          initial={animated ? { width: 0 } : { width: `${pct}%` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle, Sparkles } from "lucide-react";
import { CommitmentBar, type CommitmentBarSeverity } from "@/components/ui";
import type { FinancialInsight, InsightSeverity } from "@/lib/insights";
import { SEVERITY_STYLES } from "@/lib/insights";

interface NyxInsightsPanelProps {
  insights: FinancialInsight[];
  isLoading?: boolean;
  title?: string;
  compact?: boolean;
  className?: string;
}

const SEVERITY_TO_BAR: Record<InsightSeverity, CommitmentBarSeverity> = {
  danger: "danger",
  warning: "warning",
  positive: "positive",
  info: "info",
};

function insightAccentWidth(severity: InsightSeverity): number {
  switch (severity) {
    case "danger":
      return 92;
    case "warning":
      return 72;
    case "positive":
      return 48;
    default:
      return 36;
  }
}

export function NyxInsightsPanel({
  insights,
  isLoading,
  title = "Insights da Nyx",
  compact = false,
  className = "",
}: NyxInsightsPanelProps) {
  if (isLoading) {
    return (
      <motion.div
        className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 ${className}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex gap-3">
          <motion.div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gradient-to-br from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] opacity-50" />
          <div className="flex-1 space-y-2.5">
            <div className="h-3 w-28 animate-pulse rounded-full bg-[var(--muted)]" />
            <div className="h-1.5 w-full animate-pulse rounded-full bg-[var(--muted)]" />
            <div className="h-4 w-4/5 animate-pulse rounded-md bg-[var(--muted)]" />
          </div>
        </div>
      </motion.div>
    );
  }

  if (insights.length === 0) {
    return (
      <motion.div
        className={`dashboard-card p-4 transition-colors duration-300 hover:border-white/10 ${className}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] text-white shadow-lg shadow-violet-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-medium tracking-wide text-[var(--nyx-gradient-start)]">
              {title}
            </p>
            <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
              Regista movimentos e compromissos — em breve tenho mais contexto para te orientar.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`space-y-3 ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between gap-2 px-0.5">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--nyx-gradient-start)]">
          {title}
        </p>
        {!compact && (
          <Link
            href="/nyx"
            className="text-xs text-[var(--muted-foreground)] transition-colors duration-200 hover:text-[var(--nyx-gradient-start)]"
          >
            Falar com Nyx →
          </Link>
        )}
      </div>

      <ul className="space-y-2">
        {insights.map((insight, i) => {
          const style = SEVERITY_STYLES[insight.severity];
          return (
            <motion.li
              key={insight.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <InsightCard insight={insight} style={style} index={i} />
            </motion.li>
          );
        })}
      </ul>

      {compact && (
        <Link
          href="/nyx"
          className="inline-flex items-center gap-2 text-xs text-[var(--nyx-gradient-start)] transition-opacity hover:opacity-80"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Conversar com Nyx
        </Link>
      )}
    </motion.div>
  );
}

function InsightCard({
  insight,
  style,
  index,
}: {
  insight: FinancialInsight;
  style: (typeof SEVERITY_STYLES)[InsightSeverity];
  index: number;
}) {
  return (
    <motion.div
      className={[
        "dashboard-card overflow-hidden border p-0 transition-[border-color,box-shadow] duration-300",
        "hover:border-white/12 hover:shadow-[0_8px_28px_rgba(0,0,0,0.22)]",
        style.border,
        style.bg,
      ].join(" ")}
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <div className="flex gap-3 p-3.5 pb-2">
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${style.dot}`} aria-hidden />
        <p className={`flex-1 text-sm leading-snug tracking-tight ${style.text}`}>
          {insight.message}
        </p>
      </div>
      <div className="px-3.5 pb-3.5 pt-0">
        <CommitmentBar
          value={insightAccentWidth(insight.severity)}
          severity={SEVERITY_TO_BAR[insight.severity]}
          animated={index < 4}
          size="sm"
        />
      </div>
    </motion.div>
  );
}

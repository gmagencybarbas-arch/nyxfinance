"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

import type { InsightSeverity } from "@/lib/insights";

interface NyxInsightCardProps {
  message: string;
  isLoading?: boolean;
  severity?: InsightSeverity;
}

const SEVERITY_ACCENT: Record<InsightSeverity, string> = {
  danger: "text-red-400",
  warning: "text-amber-400",
  positive: "text-emerald-400",
  info: "text-[var(--nyx-gradient-start)]",
};

export function NyxInsightCard({ message, isLoading, severity = "info" }: NyxInsightCardProps) {
  if (isLoading) {
    return (
      <motion.div
        className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] opacity-60 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 rounded bg-[var(--muted)] animate-pulse" />
            <div className="h-4 w-full rounded bg-[var(--muted)] animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-[var(--muted)] animate-pulse" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.12 }}
    >
      <Link
        href="/nyx"
        className="block dashboard-card p-4 hover:border-[var(--nyx-gradient-start)]/30"
      >
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] text-white">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-medium mb-1 ${SEVERITY_ACCENT[severity]}`}>
              Insight da Nyx
            </p>
            <p className="text-sm text-[var(--foreground)] line-clamp-2">{message}</p>
            <p className="text-xs text-[var(--nyx-gradient-start)] mt-2">Conversar com Nyx →</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

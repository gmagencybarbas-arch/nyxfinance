"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle, ChevronRight } from "lucide-react";

interface NyxQuickInsightProps {
  message: string;
}

export function NyxQuickInsight({ message }: NyxQuickInsightProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
    >
      <Link
        href="/nyx"
        className="block rounded-2xl border border-[var(--border)] bg-[var(--card)]/60 backdrop-blur p-4 shadow-[0_0_16px_rgba(167,139,250,0.04)] hover:border-[var(--nyx-gradient-start)]/30 hover:shadow-[0_0_20px_rgba(167,139,250,0.08)] transition-all"
      >
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] text-white">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[var(--nyx-gradient-start)] mb-0.5">
              Nyx Quick Insight
            </p>
            <p className="text-sm text-[var(--foreground)] line-clamp-2">{message}</p>
            <p className="text-xs text-[var(--nyx-gradient-start)] mt-2 flex items-center gap-0.5">
              Ver análise completa
              <ChevronRight className="w-3.5 h-3.5" />
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

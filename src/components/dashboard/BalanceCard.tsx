"use client";

import { motion } from "framer-motion";
import { Wallet } from "lucide-react";

interface BalanceCardProps {
  balance: number;
  isLoading?: boolean;
}

export function BalanceCard({ balance, isLoading }: BalanceCardProps) {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(balance);

  if (isLoading) {
    return (
      <motion.div
        className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--muted)] animate-pulse" />
          <div className="h-4 w-20 rounded bg-[var(--muted)] animate-pulse" />
        </div>
        <div className="h-10 w-36 rounded-lg bg-[var(--muted)] animate-pulse" />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="dashboard-card dashboard-card-glow balance-card-hero relative overflow-hidden p-6 sm:p-7"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--nyx-gradient-start)]/20 text-[var(--nyx-gradient-start)]">
          <Wallet className="w-5 h-5" />
        </div>
        <p className="text-xs sm:text-sm text-[var(--muted-foreground)] font-medium tracking-wide">
          Saldo atual
        </p>
      </div>
      <p className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] bg-clip-text text-transparent">
        {formatted}
      </p>
    </motion.div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  category: string;
  status?: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Math.abs(v));
}

export function RecentTransactions({ transactions, isLoading }: RecentTransactionsProps) {
  if (isLoading) {
    return (
      <motion.div
        className="dashboard-card overflow-hidden"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="px-4 py-3 border-b border-[var(--border)] flex justify-between items-center">
          <p className="text-sm font-semibold text-[var(--foreground)]">Últimos lançamentos</p>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-[var(--muted)] animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-24 rounded bg-[var(--muted)] animate-pulse mb-2" />
                <div className="h-3 w-16 rounded bg-[var(--muted)] animate-pulse" />
              </div>
              <div className="h-4 w-14 rounded bg-[var(--muted)] animate-pulse" />
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="dashboard-card overflow-hidden"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.08 }}
    >
      <div className="px-4 py-3 border-b border-[var(--border)] flex justify-between items-center">
        <p className="text-sm font-semibold text-[var(--foreground)]">Últimos lançamentos</p>
        <Link
          href="/transactions"
          className="flex items-center gap-0.5 text-xs font-medium text-[var(--nyx-gradient-start)] hover:underline"
        >
          Ver todos
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {transactions.slice(0, 5).map((t, i) => (
          <motion.div
            key={t.id}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--muted)]/30 transition-colors"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.03 * i }}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                t.type === "income" ? "bg-emerald-500/20" : "bg-red-500/20"
              }`}
            >
              {t.type === "income" ? (
                <ArrowDownRight className="w-5 h-5 text-emerald-500" />
              ) : (
                <ArrowUpRight className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)] truncate">
                {t.description}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {t.date}
                {t.status === "PENDING" && (
                  <span className="ml-1.5 rounded px-1 py-0.5 text-[10px] text-violet-300 bg-violet-500/15">
                    Previsto
                  </span>
                )}
              </p>
            </div>
            <p
              className={`text-sm font-medium ${
                t.type === "income" ? "text-emerald-500" : "text-red-400"
              }`}
            >
              {t.type === "income" ? "+" : "-"}
              {formatCurrency(t.amount)}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

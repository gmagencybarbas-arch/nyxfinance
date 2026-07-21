"use client";

import { motion } from "framer-motion";
import type { SummaryMode } from "./SummaryToggle";

interface CategoryItem {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

interface CategoryBreakdownProps {
  categories: CategoryItem[];
  mode: SummaryMode;
  isLoading?: boolean;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

export function CategoryBreakdown({ categories, mode, isLoading }: CategoryBreakdownProps) {
  const title = mode === "year" ? "Categorias (ano)" : "Categorias (mês)";

  if (isLoading) {
    return (
      <motion.div
        className="dashboard-card overflow-hidden"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="w-3 h-3 rounded-full bg-[var(--muted)] animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-24 rounded bg-[var(--muted)] animate-pulse mb-1" />
                <div className="h-2 w-full rounded-full bg-[var(--muted)] animate-pulse" />
              </div>
              <div className="h-4 w-16 rounded bg-[var(--muted)] animate-pulse" />
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  const maxAmount = Math.max(...categories.map((c) => c.amount), 1);

  return (
    <motion.div
      className="dashboard-card overflow-hidden"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.08 }}
    >
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--muted)]/30 transition-colors"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.02 * i }}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)]">{cat.name}</p>
              <div className="mt-1 h-1.5 w-full rounded-full bg-[var(--muted)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: cat.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(cat.amount / maxAmount) * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
                />
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-[var(--foreground)]">
                {formatCurrency(cat.amount)}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">{cat.percentage}%</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

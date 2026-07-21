"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { MOCK_CATEGORY_COLORS } from "./mockData";
import type { Transaction } from "./mockData";

interface CategorySummaryTabProps {
  transactions: Transaction[];
  loading?: boolean;
  error?: boolean;
}

interface CategorySummary {
  name: string;
  total: number;
  count: number;
  percentage: number;
  color: string;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Math.abs(v));
}

/** Only expenses (amount < 0). Totals as absolute values. Sorted by total descending. */
function aggregateByCategory(
  transactions: { category: string; amount: number; type: string }[]
): CategorySummary[] {
  const byCategory: Record<string, { total: number; count: number }> = {};
  let totalExpenses = 0;

  for (const t of transactions) {
    if (t.type !== "expense" || t.amount >= 0) continue;
    const abs = Math.abs(t.amount);
    if (!byCategory[t.category]) byCategory[t.category] = { total: 0, count: 0 };
    byCategory[t.category].total += abs;
    byCategory[t.category].count += 1;
    totalExpenses += abs;
  }

  const result: CategorySummary[] = Object.entries(byCategory).map(
    ([name, { total, count }]) => ({
      name,
      total,
      count,
      percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
      color: MOCK_CATEGORY_COLORS[name] ?? "#64748b",
    })
  );

  return result.sort((a, b) => b.total - a.total);
}

function CategorySummarySkeleton() {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="dashboard-card overflow-hidden divide-y divide-[var(--border)]">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="px-4 py-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--muted)]/60 animate-pulse" />
                <div className="h-4 w-24 rounded bg-[var(--muted)]/50 animate-pulse" />
              </div>
              <div className="h-4 w-20 rounded bg-[var(--muted)]/50 animate-pulse" />
            </div>
            <div className="h-1.5 w-full rounded-full bg-[var(--muted)]/40 animate-pulse" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function CategorySummaryError() {
  return (
    <motion.div
      className="dashboard-card overflow-hidden p-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <p className="text-sm text-[var(--muted-foreground)]">
        Não foi possível carregar o resumo por categoria.
      </p>
    </motion.div>
  );
}

function CategorySummaryEmpty() {
  return (
    <motion.div
      className="dashboard-card overflow-hidden p-8 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <p className="text-sm text-[var(--muted-foreground)]">
        Nenhuma despesa no período selecionado.
      </p>
    </motion.div>
  );
}

export function CategorySummaryTab({ transactions = [], loading, error }: CategorySummaryTabProps) {
  const summary = useMemo(
    () => aggregateByCategory(transactions),
    [transactions]
  );

  // TEMP debug: single source — same transactions as TransactionList
  const expenses = useMemo(
    () => transactions.filter((t) => t.type === "expense" && t.amount < 0),
    [transactions]
  );
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[CategorySummaryTab TEMP]", {
      incomingTransactionsLength: transactions.length,
      categoriesBeforeAggregation: [...new Set(expenses.map((t) => t.category))],
      filteredExpensesLength: expenses.length,
      summaryCountTotal: summary.reduce((acc, s) => acc + s.count, 0),
    });
  }

  if (loading) return <CategorySummarySkeleton />;
  if (error) return <CategorySummaryError />;
  if (summary.length === 0) return <CategorySummaryEmpty />;

  const maxTotal = Math.max(...summary.map((s) => s.total), 1);

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="dashboard-card overflow-hidden divide-y divide-[var(--border)]">
        {summary.map((cat, i) => (
          <motion.div
            key={cat.name}
            className="px-4 py-4"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.03 * i }}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <p className="text-sm font-medium text-[var(--foreground)]">{cat.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {formatCurrency(cat.total)}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {cat.count} lançamento{cat.count !== 1 ? "s" : ""} • {cat.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[var(--muted)] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: cat.color }}
                initial={{ width: 0 }}
                animate={{ width: `${(cat.total / maxTotal) * 100}%` }}
                transition={{ duration: 0.5, delay: 0.05 + i * 0.05 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

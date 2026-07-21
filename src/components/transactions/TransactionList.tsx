"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { TransactionItem } from "./TransactionItem";
import { TransactionDetailModal } from "./TransactionDetailModal";
import { TransactionsEmpty } from "./TransactionsEmpty";
import { apiRowsToTransactions, type ApiTransactionRow } from "./transactionListMappers";
import type { Transaction } from "./mockData";
import type { DateRange } from "./types";

function groupByDate(transactions: Transaction[]): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {};
  for (const t of transactions) {
    const key = t.date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }
  return groups;
}

function getDateOrder(dateKey: string): number {
  return new Date(dateKey).getTime();
}

function formatDateLabel(dateKey: string): string {
  const d = new Date(dateKey);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
}

/** Skeleton de um item da lista (loading state) */
function TransactionListSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: i * 0.05 }}
        >
          <div className="h-3 w-16 rounded bg-[var(--muted)]/60" />
          <div className="dashboard-card overflow-hidden divide-y divide-[var(--border)]">
            {[1, 2, 3, 4].map((j) => (
              <div
                key={j}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="w-11 h-11 rounded-full bg-[var(--muted)]/50 animate-pulse flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 w-32 rounded bg-[var(--muted)]/50 animate-pulse" />
                  <div className="h-3 w-24 rounded bg-[var(--muted)]/40 animate-pulse" />
                </div>
                <div className="h-4 w-20 rounded bg-[var(--muted)]/50 animate-pulse" />
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export type TransactionListSource =
  | { mode: "api"; userId: string; dateRange: DateRange }
  | { mode: "static"; transactions: Transaction[] };

interface TransactionListProps {
  source: TransactionListSource;
  loadingOverride?: boolean;
  errorOverride?: boolean;
  onDeleted?: () => void;
}

export function TransactionList({
  source,
  loadingOverride,
  errorOverride,
  onDeleted,
}: TransactionListProps) {
  const [apiTransactions, setApiTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(source.mode === "api");
  const [error, setError] = useState(false);
  const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(null);

  const fetchTransactions = useCallback(async (userId: string, range: DateRange) => {
    setLoading(true);
    setError(false);
    try {
      const from = range.start.toISOString().slice(0, 10);
      const to = range.end.toISOString().slice(0, 10);
      const res = await fetch(
        `/api/transactions?userId=${encodeURIComponent(userId)}&from=${from}&to=${to}`
      );
      if (!res.ok) {
        setApiTransactions([]);
        setError(true);
        return;
      }
      const rows = (await res.json()) as ApiTransactionRow[];
      const mapped = apiRowsToTransactions(rows);
      setApiTransactions(mapped);
    } catch {
      setApiTransactions([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (source.mode !== "api") return;
    fetchTransactions(source.userId, source.dateRange);
  }, [
    source.mode,
    source.mode === "api" ? source.userId : "",
    source.mode === "api" ? source.dateRange.start.getTime() : 0,
    source.mode === "api" ? source.dateRange.end.getTime() : 0,
    fetchTransactions,
  ]);

  const transactions = source.mode === "static" ? source.transactions : apiTransactions;

  const grouped = useMemo(() => {
    const groups = groupByDate(transactions);
    return Object.entries(groups).sort(
      ([a], [b]) => getDateOrder(b) - getDateOrder(a)
    );
  }, [transactions]);

  const showLoading = source.mode === "api" ? loading : (loadingOverride ?? false);
  const showError = source.mode === "api" ? error : (errorOverride ?? false);

  if (showLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <TransactionListSkeleton />
      </motion.div>
    );
  }

  if (showError) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-12 px-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-sm text-[var(--muted-foreground)]">
          Não foi possível carregar as transações. Tente novamente.
        </p>
      </motion.div>
    );
  }

  if (transactions.length === 0) {
    return <TransactionsEmpty />;
  }

  let itemIndex = 0;
  return (
    <>
      <div className="space-y-6">
        {grouped.map(([dateKey, items]) => {
          const label = formatDateLabel(dateKey);
          return (
            <motion.section
              key={dateKey}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3 px-1">
                {label}
              </p>
              <div className="dashboard-card overflow-hidden divide-y divide-[var(--border)]">
                {items.map((t) => (
                  <TransactionItem
                    key={t.id}
                    transaction={t}
                    index={itemIndex++}
                    onSelect={setDetailTransaction}
                  />
                ))}
              </div>
            </motion.section>
          );
        })}
      </div>
      <TransactionDetailModal
        transaction={detailTransaction}
        onClose={() => setDetailTransaction(null)}
        canEdit
        canUpdateStatus={
          detailTransaction?.type === "expense" &&
          detailTransaction.status !== "COMPLETED" &&
          detailTransaction.status !== "CANCELED"
        }
        onUpdated={() => {
          if (source.mode === "api") {
            void fetchTransactions(source.userId, source.dateRange);
          }
          onDeleted?.();
        }}
        onDeleted={() => {
          if (source.mode === "api") {
            void fetchTransactions(source.userId, source.dateRange);
          }
          onDeleted?.();
        }}
      />
    </>
  );
}

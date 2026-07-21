"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Transaction } from "./mockData";

interface TransactionItemProps {
  transaction: Transaction;
  index?: number;
  onSelect?: (transaction: Transaction) => void;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Math.abs(v));
}

export function TransactionItem({
  transaction,
  index = 0,
  onSelect,
}: TransactionItemProps) {
  const { description, amount, type, dateLabel, category, status } = transaction;
  const isPending = status === "PENDING";

  return (
    <motion.div
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={() => onSelect?.(transaction)}
      onKeyDown={(e) => {
        if (!onSelect) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(transaction);
        }
      }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-[var(--muted)]/40 active:bg-[var(--muted)]/60 transition-colors"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
          type === "income" ? "bg-emerald-500/20" : "bg-red-500/20"
        }`}
      >
        {type === "income" ? (
          <ArrowDownRight className="w-5 h-5 text-emerald-500" />
        ) : (
          <ArrowUpRight className="w-5 h-5 text-red-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)] truncate">
          {description}
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {category} • {dateLabel}
          {isPending ? (
            <span className="ml-1.5 rounded px-1 py-0.5 text-[10px] text-violet-300 bg-violet-500/15">
              Previsto
            </span>
          ) : null}
        </p>
      </div>
      <p
        className={`text-sm font-semibold ${
          type === "income" ? "text-emerald-500" : "text-red-400"
        }`}
      >
        {type === "income" ? "+" : "-"}
        {formatCurrency(amount)}
      </p>
    </motion.div>
  );
}

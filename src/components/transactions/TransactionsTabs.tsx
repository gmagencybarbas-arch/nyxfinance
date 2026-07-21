"use client";

import { motion } from "framer-motion";
import type { TransactionTab } from "./types";

interface TransactionsTabsProps {
  value: TransactionTab;
  onChange: (v: TransactionTab) => void;
}

const TABS: { value: TransactionTab; label: string }[] = [
  { value: "historico", label: "Histórico" },
  { value: "categorias", label: "Categorias" },
  { value: "analise", label: "Análise" },
];

export function TransactionsTabs({ value, onChange }: TransactionsTabsProps) {
  return (
    <motion.div
      className="flex rounded-xl bg-[var(--muted)]/50 p-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {TABS.map((tab) => {
        const isActive = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`relative flex-1 py-2.5 text-sm font-medium rounded-lg transition z-10 ${
              isActive ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="transactions-tab-indicator"
                className="absolute inset-0 rounded-lg bg-[var(--card)] border border-[var(--border)] shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative">{tab.label}</span>
          </button>
        );
      })}
    </motion.div>
  );
}

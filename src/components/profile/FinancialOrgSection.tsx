"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Repeat } from "lucide-react";
import { formatCurrency } from "./utils/profile";
import type { RecurringExpense } from "./types";

interface FinancialOrgSectionProps {
  items: RecurringExpense[];
  onManage: () => void;
}

function FinancialOrgSectionBase({ items, onManage }: FinancialOrgSectionProps) {
  const { activeCount, monthlyTotal } = useMemo(() => {
    const active = items.filter((i) => i.active !== false);
    return {
      activeCount: active.length,
      monthlyTotal: active.reduce((sum, i) => sum + i.amount, 0),
    };
  }, [items]);

  const meta =
    activeCount === 0
      ? "Nenhuma ativa"
      : `${activeCount} ativa${activeCount === 1 ? "" : "s"} · ${formatCurrency(monthlyTotal, 2)}/mês`;

  return (
    <motion.section
      className="dashboard-card dashboard-card-glow relative overflow-hidden p-4 sm:p-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      aria-labelledby="financial-org-title"
    >
      <h3
        id="financial-org-title"
        className="mb-4 text-sm font-semibold text-[var(--foreground)]"
      >
        Organização financeira
      </h3>

      <button
        type="button"
        onClick={onManage}
        className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[var(--muted)]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--muted)]">
          <Repeat className="h-5 w-5 text-[var(--muted-foreground)]" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--foreground)]">
            Despesas recorrentes
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Gerencie assinaturas, contas fixas e pagamentos automáticos.
          </p>
          <p className="mt-1 text-xs font-medium tabular-nums text-[var(--foreground)]/80">
            {meta}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--muted-foreground)]">
          Gerenciar
          <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      </button>
    </motion.section>
  );
}

export const FinancialOrgSection = memo(FinancialOrgSectionBase);

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { monthLabel } from "@/lib/planning/planningFormat";

interface MonthSelectorProps {
  monthKey: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  quickMonths: { key: string; label: string }[];
  onSelectMonth: (key: string) => void;
}

export function MonthSelector({
  monthKey,
  onPrev,
  onNext,
  onToday,
  quickMonths,
  onSelectMonth,
}: MonthSelectorProps) {
  return (
    <motion.section
      className="dashboard-card p-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--muted)]/30"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-base font-semibold tracking-tight text-[var(--foreground)]">
          {monthLabel(monthKey)}
        </p>
        <button
          type="button"
          onClick={onNext}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--muted)]/30"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onToday}
          className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--muted-foreground)]"
        >
          Hoje
        </button>
        {quickMonths.map((q) => (
          <button
            key={q.key}
            type="button"
            onClick={() => onSelectMonth(q.key)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              q.key === monthKey
                ? "bg-gradient-to-r from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] text-white"
                : "border border-[var(--border)] text-[var(--muted-foreground)]"
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>
    </motion.section>
  );
}

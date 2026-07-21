"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, ChevronRight } from "lucide-react";
import {
  CommitmentBar,
  commitmentSeverityFromPercent,
  pressurePercent,
} from "@/components/ui";
import { formatBRL } from "@/lib/planning/planningFormat";
import type { ProjectionMonth } from "@/lib/planning/types";

const INITIAL_MONTHS = 2;

interface ProjectionSectionProps {
  months: ProjectionMonth[];
  selectedMonthKey: string;
  onSelectMonth: (monthKey: string) => void;
}

export function ProjectionSection({
  months,
  selectedMonthKey,
  onSelectMonth,
}: ProjectionSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const visibleMonths = useMemo(() => {
    if (expanded || months.length <= INITIAL_MONTHS) return months;
    return months.slice(0, INITIAL_MONTHS);
  }, [months, expanded]);

  const hiddenCount = Math.max(0, months.length - INITIAL_MONTHS);

  if (months.length === 0) return null;

  function handleSelect(monthKey: string) {
    onSelectMonth(monthKey);
    document.getElementById("planning-month-anchor")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <section className="space-y-3">
      <motion.div className="flex items-center gap-2 px-1">
        <TrendingUp className="h-4 w-4 text-[var(--nyx-gradient-start)]" />
        <h2 className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
          Projeção futura
        </h2>
      </motion.div>
      <p className="px-1 text-xs text-[var(--muted-foreground)]">
        Toque num mês para ver o planejamento completo dele
        {!expanded && hiddenCount > 0
          ? ` · mostrando ${INITIAL_MONTHS} de ${months.length}`
          : ""}
        .
      </p>
      <motion.div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {visibleMonths.map((m, i) => {
          const pressure = pressurePercent(m.committed, m.expectedIncome);
          const expectedPercent = pressurePercent(m.expectedExpenses, m.expectedIncome);
          const isSelected = m.monthKey === selectedMonthKey;

          return (
            <motion.button
              key={m.monthKey}
              type="button"
              onClick={() => handleSelect(m.monthKey)}
              className={[
                "dashboard-card w-full p-4 text-left transition-[border-color,box-shadow,transform] duration-300",
                "hover:border-white/10 hover:shadow-[0_6px_24px_rgba(0,0,0,0.25)]",
                m.isHeavy ? "border-amber-500/30 ring-1 ring-amber-500/15" : "",
                isSelected
                  ? "border-[var(--nyx-gradient-start)]/50 ring-2 ring-[var(--nyx-gradient-start)]/25"
                  : "",
              ].join(" ")}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 380, damping: 26 }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium tracking-tight text-[var(--foreground)]">{m.label}</p>
                <div className="flex items-center gap-1.5">
                  {m.isHeavy && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-amber-400">
                      <AlertTriangle className="h-3 w-3" />
                      Pesado
                    </span>
                  )}
                  {isSelected && (
                    <span className="rounded-md bg-[var(--nyx-gradient-start)]/15 px-1.5 py-0.5 text-[10px] font-medium text-[var(--nyx-gradient-start)]">
                      Atual
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Sobra estimada{" "}
                <span
                  className={
                    m.freeEstimate < 0
                      ? "font-semibold text-red-400"
                      : m.freeEstimate > 0
                        ? "font-semibold text-[var(--nyx-gradient-end)]"
                        : "font-semibold text-amber-400"
                  }
                >
                  {formatBRL(m.freeEstimate)}
                </span>
              </p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Comprometido {formatBRL(m.committed)}
              </p>
              {m.expectedIncome > 0 && (
                <div className="mt-3 space-y-2">
                  <CommitmentBar
                    label="Comprometido"
                    value={pressure}
                    severity={commitmentSeverityFromPercent(pressure)}
                    animated={i < 4}
                    showPercentage
                    size="sm"
                  />
                  <CommitmentBar
                    label="Previsto"
                    value={expectedPercent}
                    severity={commitmentSeverityFromPercent(expectedPercent)}
                    animated={i < 4}
                    showPercentage
                    size="sm"
                  />
                </div>
              )}
              <p className="mt-3 flex items-center gap-1 text-xs font-medium text-[var(--nyx-gradient-start)]">
                Ver planejamento do mês
                <ChevronRight className="h-3.5 w-3.5" />
              </p>
            </motion.button>
          );
        })}
      </motion.div>

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-[var(--nyx-gradient-start)] transition hover:border-violet-400/30 hover:bg-violet-500/10"
        >
          {expanded
            ? "Ver menos meses"
            : `Ver mais (${hiddenCount} mês${hiddenCount === 1 ? "" : "es"})`}
        </button>
      )}
    </section>
  );
}

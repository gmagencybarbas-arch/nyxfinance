"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanning } from "./usePlanning";
import { MonthSelector } from "./MonthSelector";
import { MonthSummaryCard } from "./MonthSummaryCard";
import { PlanningGrid } from "./PlanningGrid";
import { InstallmentCards } from "./InstallmentCards";
import { RecurringPlanningSection } from "./RecurringPlanningSection";
import { ProjectionSection } from "./ProjectionSection";
import { AddEntryButton } from "./add-entry/AddEntryButton";

function buildNyxInsight(
  committedPercent: number,
  freeEstimate: number,
  installmentCount: number,
  recurringCount: number
): string {
  if (committedPercent <= 35) {
    return `Mês confortável: sua pressão está em ${committedPercent}%. Mantém este ritmo e separa uma parte dos ${Math.max(0, freeEstimate).toFixed(0)} livres para reserva.`;
  }
  if (committedPercent <= 65) {
    return `Mês estável, mas pede atenção: ${installmentCount} parcelamentos e ${recurringCount} contas mensais já ocupam boa parte da receita.`;
  }
  return `Mês mais apertado: o comprometimento está em ${committedPercent}%. Vale revisar contas mensais e adiar novos gastos parcelados.`;
}

export function PlanningContent() {
  const { user } = useAuth();
  const {
    monthKey,
    monthView,
    projection,
    recurring,
    loading,
    error,
    goMonth,
    goToToday,
    selectMonthKey,
    toggleRecurringActive,
    quickMonths,
    refetch,
  } = usePlanning(user?.id ?? null);

  if (!user) {
    return (
      <p className="text-center text-sm text-[var(--muted-foreground)]">
        Inicia sessão para ver o teu planejamento.
      </p>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="dashboard-card h-28 animate-pulse bg-[var(--muted)]/40" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="dashboard-card border-red-500/30 p-4 text-sm text-red-400">
          {error}
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 block text-xs font-medium text-[var(--nyx-gradient-start)] underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && monthView && (
        <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div id="planning-month-anchor" className="scroll-mt-4" />
          <div className="flex items-center justify-end">
            <AddEntryButton onSaved={refetch} className="w-auto" />
          </div>

          <MonthSummaryCard monthKey={monthKey} summary={monthView.summary} />

          <MonthSelector
            monthKey={monthKey}
            onPrev={() => goMonth(-1)}
            onNext={() => goMonth(1)}
            onToday={goToToday}
            quickMonths={quickMonths}
            onSelectMonth={selectMonthKey}
          />

          <section className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Sparkles className="h-4 w-4 text-[var(--nyx-gradient-start)]" />
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Insights da Nyx</h2>
            </div>
            <article className="dashboard-card dashboard-card-glow relative overflow-hidden p-4">
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--nyx-gradient-start)]/10 via-transparent to-[var(--nyx-gradient-end)]/10"
                aria-hidden
              />
              <p className="relative text-sm leading-relaxed text-[var(--foreground)]">
                {buildNyxInsight(
                  monthView.summary.committedPercent,
                  monthView.summary.freeEstimate,
                  monthView.installmentPlans.length,
                  recurring.filter((r) => r.active).length
                )}
              </p>
            </article>
          </section>

          <InstallmentCards plans={monthView.installmentPlans} />
          <RecurringPlanningSection
            items={recurring}
            onToggleActive={toggleRecurringActive}
            onChanged={refetch}
          />
          <PlanningGrid rows={monthView.rows} onDeleted={refetch} />
          <ProjectionSection
            months={projection}
            selectedMonthKey={monthKey}
            onSelectMonth={selectMonthKey}
          />
        </motion.div>
      )}
    </div>
  );
}

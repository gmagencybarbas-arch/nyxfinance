"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CommitmentBar, commitmentSeverityFromPercent, pressurePercent } from "@/components/ui";
import { formatBRL, monthLabel } from "@/lib/planning/planningFormat";
import type { MonthSummary } from "@/lib/planning/types";
import { HorizontalSnapCarousel } from "./HorizontalSnapCarousel";

function incomeSourceNote(source: MonthSummary["incomeSource"]): string {
  if (source === "transactions") return "Soma das receitas lançadas no mês";
  if (source === "monthly_income") return "Renda mensal informada no perfil";
  if (source === "salary_range") return "Estimativa pela faixa salarial do perfil";
  return "Defina renda no perfil ou lance uma receita";
}

interface MonthSummaryCardProps {
  monthKey: string;
  summary: MonthSummary;
}

type Slide = { title: string; value: string; note: string };

export function MonthSummaryCard({ monthKey, summary }: MonthSummaryCardProps) {
  const isDeficit = summary.freeEstimate < 0;
  const committedPct = summary.committedPercent;
  const expectedPct = pressurePercent(summary.expectedExpenses, summary.expectedIncome);

  const slides = useMemo<Slide[]>(
    () => [
      {
        title: "Receita prevista",
        value: formatBRL(summary.expectedIncome),
        note: incomeSourceNote(summary.incomeSource),
      },
      {
        title: "Comprometido",
        value: formatBRL(summary.committed),
        note: `${committedPct}% da receita`,
      },
      {
        title: "Gastos previstos",
        value: formatBRL(summary.expectedExpenses),
        note: "Realizado + previsto",
      },
      {
        title: "Livre estimado",
        value: formatBRL(summary.freeEstimate),
        note: isDeficit ? "Compromissos acima da receita" : "Disponível para planejar",
      },
    ],
    [summary, committedPct, isDeficit]
  );

  return (
    <section className="space-y-4">
      <motion.div
        className="dashboard-card dashboard-card-glow relative overflow-hidden p-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--nyx-gradient-start)]/15 via-transparent to-[var(--nyx-gradient-end)]/10"
          aria-hidden
        />
        <div className="relative">
          <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
            {monthLabel(monthKey)}
          </p>
          <p
            className={`mt-2 text-4xl font-bold tracking-tight ${
              isDeficit ? "text-red-400" : "text-[var(--foreground)]"
            }`}
          >
            {formatBRL(summary.freeEstimate)}
            <span
              className={`ml-2 text-base font-medium ${
                isDeficit ? "text-red-300/90" : "text-[var(--nyx-gradient-end)]"
              }`}
            >
              {isDeficit ? "no negativo" : "livres"}
            </span>
          </p>
          <div className="mt-4">
            <CommitmentBar
              label="Comprometido"
              value={Math.min(100, committedPct)}
              severity={commitmentSeverityFromPercent(Math.min(100, committedPct))}
              showPercentage
            />
          </div>
          {committedPct > 100 && (
            <p className="mt-1 text-xs font-medium text-red-400">
              {committedPct}% da receita — acima do previsto
            </p>
          )}
          <p className="mt-3 text-xs text-[var(--muted-foreground)]">
            Após parcelas e compromissos.
          </p>
        </div>
      </motion.div>

      <HorizontalSnapCarousel dotCount={slides.length}>
        {slides.map((item) => (
          <article key={item.title} className="dashboard-card h-full p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
              {item.title}
            </p>
            <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{item.value}</p>
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">{item.note}</p>
          </article>
        ))}
      </HorizontalSnapCarousel>

      {summary.expectedIncome > 0 && (
        <p className="px-1 text-xs text-[var(--muted-foreground)]">
          Previsto total do mês: <strong>{expectedPct}%</strong> da receita.
        </p>
      )}
    </section>
  );
}

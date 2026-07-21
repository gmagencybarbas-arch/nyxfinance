"use client";

import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import { CommitmentBar } from "@/components/ui";
import { formatBRL } from "@/lib/planning/planningFormat";
import type { InstallmentPlanView } from "@/lib/planning/types";
import { HorizontalSnapCarousel } from "./HorizontalSnapCarousel";

interface InstallmentCardsProps {
  plans: InstallmentPlanView[];
}

export function InstallmentCards({ plans }: InstallmentCardsProps) {
  if (plans.length === 0) return null;

  return (
    <section className="space-y-3">
      <motion.div className="flex items-center gap-2 px-1">
        <Layers className="h-4 w-4 text-[var(--nyx-gradient-start)]" />
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Parcelamentos ativos</h2>
      </motion.div>
      <HorizontalSnapCarousel
        dotCount={plans.length}
        slideClassName="min-w-[82%] shrink-0 snap-start sm:min-w-[320px]"
      >
        {plans.map((plan) => (
          <article key={plan.planId} className="dashboard-card h-full p-4">
            <p className="truncate font-medium text-[var(--foreground)]">{plan.description}</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {plan.currentInstallment}/{plan.totalInstallments} · {formatBRL(plan.amountPerMonth)}/mês
            </p>
            <div className="mt-3">
              <CommitmentBar value={plan.progressPercent} severity="neutral" showPercentage size="sm" />
            </div>
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Termina em <strong className="text-[var(--nyx-gradient-start)]">{plan.endMonthLabel}</strong>
            </p>
          </article>
        ))}
      </HorizontalSnapCarousel>
    </section>
  );
}

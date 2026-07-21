import { monthLabel } from "@/lib/planning/planningFormat";
import type { FinancialInsight, FinancialInsightContext, InsightRule } from "./insightTypes";

const MS_DAY = 86400000;

function id(suffix: string): string {
  return `insight-${suffix}`;
}

function activeRecurringTotal(ctx: FinancialInsightContext): number {
  return ctx.recurringBills.filter((b) => b.active).reduce((s, b) => s + b.amount, 0);
}

function ruleCommitmentHigh(ctx: FinancialInsightContext): FinancialInsight | null {
  const p = ctx.current.summary.committedPercent;
  if (p >= 95) {
    return {
      id: id("commitment-critical"),
      severity: "danger",
      category: "commitment",
      priority: 95,
      message: `O teu comprometimento em ${ctx.focusMonthLabel.split(" ")[0]} está acima de 95% — quase tudo da receita já tem destino.`,
      meta: { committedPercent: p },
    };
  }
  if (p >= 80) {
    return {
      id: id("commitment-high"),
      severity: "warning",
      category: "commitment",
      priority: 85,
      message: `O teu comprometimento está acima de 80% — a margem para imprevistos fica apertada.`,
      meta: { committedPercent: p },
    };
  }
  return null;
}

function ruleHealthyMargin(ctx: FinancialInsightContext): FinancialInsight | null {
  const { committedPercent, freeEstimate, expectedIncome } = ctx.current.summary;
  if (expectedIncome <= 0) return null;
  if (committedPercent < 55 && freeEstimate > expectedIncome * 0.25) {
    return {
      id: id("margin-ok"),
      severity: "positive",
      category: "commitment",
      priority: 60,
      message: `Boa folga em ${ctx.focusMonthLabel.split(" ")[0]} — tens espaço confortável depois dos compromissos fixos.`,
      meta: { freeEstimate, committedPercent },
    };
  }
  return null;
}

function ruleLowFreeCash(ctx: FinancialInsightContext): FinancialInsight | null {
  const { freeEstimate, expectedIncome } = ctx.current.summary;
  if (expectedIncome <= 0) return null;
  if (freeEstimate < 0) {
    return {
      id: id("free-negative"),
      severity: "danger",
      category: "balance",
      priority: 90,
      message: `Neste mês, os compromissos passam a receita prevista — vale rever parcelas e contas fixas.`,
      meta: { freeEstimate },
    };
  }
  if (freeEstimate < expectedIncome * 0.08) {
    return {
      id: id("free-tight"),
      severity: "warning",
      category: "balance",
      priority: 75,
      message: `A sobra prevista está bem baixa — qualquer extra pode apertar o mês.`,
      meta: { freeEstimate },
    };
  }
  return null;
}

function ruleTighterMonth(ctx: FinancialInsightContext): FinancialInsight | null {
  const current = ctx.current.summary.committed;
  const future = ctx.projection.slice(1, 6);
  if (future.length < 2 || current <= 0) return null;

  const avgFuture =
    future.reduce((s, m) => s + m.committed, 0) / future.length;
  if (avgFuture <= 0) return null;

  const ratio = current / avgFuture;
  if (ratio >= 1.2) {
    const monthName = ctx.focusMonthLabel.split(" ")[0];
    return {
      id: id("tighter-month"),
      severity: "warning",
      category: "projection",
      priority: 78,
      message: `${monthName} está mais apertado que os meses à frente — o comprometido pesa mais agora.`,
      meta: { current, avgFuture, ratio },
    };
  }
  return null;
}

function ruleCostWillDecrease(ctx: FinancialInsightContext): FinancialInsight | null {
  const current = ctx.current.summary.committed;
  if (current <= 0) return null;

  for (const m of ctx.projection.slice(1, 8)) {
    if (m.committed < current * 0.85) {
      const name = m.label.split(" ")[0] ?? m.label;
      return {
        id: id(`ease-${m.monthKey}`),
        severity: "positive",
        category: "projection",
        priority: 70,
        message: `O teu custo mensal fixo tende a aliviar em ${name} — menos peso nos compromissos.`,
        meta: { monthKey: m.monthKey, before: current, after: m.committed },
      };
    }
  }
  return null;
}

function ruleHeavyFutureMonth(ctx: FinancialInsightContext): FinancialInsight | null {
  const heavy = ctx.projection.find((m, i) => i > 0 && m.isHeavy);
  if (!heavy) return null;
  const name = heavy.label.split(" ")[0] ?? heavy.label;
  return {
    id: id(`heavy-${heavy.monthKey}`),
    severity: "warning",
    category: "projection",
    priority: 72,
    message: `${name} pode ser o mês mais pesado à frente — convém ir preparando o caixa.`,
    meta: { monthKey: heavy.monthKey },
  };
}

function ruleInstallmentsEnding(ctx: FinancialInsightContext): FinancialInsight | null {
  const now = ctx.refDate.getTime();
  const horizon = now + 60 * MS_DAY;
  const ending: string[] = [];

  for (const plan of ctx.installmentPlans) {
    if (plan.remaining <= 0) continue;
    const raw = ctx.rawInstallmentPlans.find((p) => p.id === plan.planId);
    const lastTx = raw?.transactions[raw.transactions.length - 1];
    if (!lastTx) continue;
    const end = new Date(lastTx.occurredAt).getTime();
    if (end >= now && end <= horizon) {
      ending.push(plan.description);
    }
  }

  if (ending.length === 0) return null;
  const n = ending.length;
  return {
    id: id("installments-ending"),
    severity: n >= 3 ? "info" : "positive",
    category: "installment",
    priority: 65,
    message:
      n === 1
        ? `A parcela «${ending[0]}» termina nos próximos 60 dias — alívio à vista.`
        : `${n} parcelas terminam nos próximos 60 dias — o teu custo fixo vai aliviar em breve.`,
    meta: { count: n, plans: ending.slice(0, 5) },
  };
}

function ruleActiveInstallments(ctx: FinancialInsightContext): FinancialInsight | null {
  const active = ctx.installmentPlans.filter((p) => p.remaining > 0);
  if (active.length < 3) return null;
  const monthly = active.reduce((s, p) => s + p.amountPerMonth, 0);
  return {
    id: id("many-installments"),
    severity: "info",
    category: "installment",
    priority: 50,
    message: `Tens ${active.length} parcelamentos ativos (~${formatShort(monthly)}/mês) — vale acompanhar no planeamento.`,
    meta: { count: active.length, monthly },
  };
}

function ruleHighRecurring(ctx: FinancialInsightContext): FinancialInsight | null {
  const recurring = activeRecurringTotal(ctx);
  const { expectedIncome, committed } = ctx.current.summary;
  if (recurring <= 0 || expectedIncome <= 0) return null;

  const shareOfIncome = recurring / expectedIncome;
  if (shareOfIncome >= 0.45) {
    const top = [...ctx.recurringBills]
      .filter((b) => b.active)
      .sort((a, b) => b.amount - a.amount)[0];
    return {
      id: id("recurring-heavy"),
      severity: "warning",
      category: "recurring",
      priority: 68,
      message: top
        ? `As contas fixas pesam forte (${Math.round(shareOfIncome * 100)}% da receita) — ${top.title} é a maior.`
        : `As contas fixas consomem mais de 45% da tua receita prevista.`,
      meta: { shareOfIncome, recurring, committed },
    };
  }
  return null;
}

function ruleCategoryGrowth(ctx: FinancialInsightContext): FinancialInsight | null {
  let bestCat: string | null = null;
  let bestGrowth = 0;

  for (const [cat, curr] of Object.entries(ctx.categorySpendCurrent)) {
    const prev = ctx.categorySpendPrevious[cat] ?? 0;
    if (curr < 80 || prev < 30) continue;
    const growth = (curr - prev) / prev;
    if (growth > bestGrowth && growth >= 0.25) {
      bestGrowth = growth;
      bestCat = cat;
    }
  }

  if (!bestCat) return null;
  const pct = Math.round(bestGrowth * 100);
  return {
    id: id(`cat-growth-${bestCat}`),
    severity: pct >= 50 ? "warning" : "info",
    category: "spending",
    priority: 62,
    message: `Aumentaste gastos com ${bestCat.toLowerCase()} (~${pct}% vs. o mês passado).`,
    meta: { category: bestCat, growth: bestGrowth },
  };
}

function ruleMonthlyExpenseVariation(ctx: FinancialInsightContext): FinancialInsight | null {
  const cur = ctx.totalExpenseCurrent;
  const prev = ctx.totalExpensePrevious;
  if (cur < 100 || prev < 100) return null;

  const change = (cur - prev) / prev;
  if (change >= 0.2) {
    return {
      id: id("expense-up"),
      severity: "warning",
      category: "spending",
      priority: 58,
      message: `Os gastos realizados subiram cerca de ${Math.round(change * 100)}% em relação ao mês anterior.`,
      meta: { change, cur, prev },
    };
  }
  if (change <= -0.15) {
    return {
      id: id("expense-down"),
      severity: "positive",
      category: "spending",
      priority: 55,
      message: `Boa notícia: gastaste menos (~${Math.abs(Math.round(change * 100))}%) que no mês passado.`,
      meta: { change, cur, prev },
    };
  }
  return null;
}

function ruleFuturePressure(ctx: FinancialInsightContext): FinancialInsight | null {
  const tightMonths = ctx.projection.filter(
    (m, i) => i > 0 && m.expectedIncome > 0 && m.freeEstimate < m.expectedIncome * 0.12
  );
  if (tightMonths.length < 2) return null;
  return {
    id: id("pressure-ahead"),
    severity: "info",
    category: "projection",
    priority: 52,
    message: `Nos próximos meses, ${tightMonths.length} períodos ficam com pouca folga — planeia antes de novos compromissos.`,
    meta: { months: tightMonths.map((m) => m.monthKey) },
  };
}

function formatShort(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Todas as regras, em ordem de avaliação. */
export const INSIGHT_RULES: InsightRule[] = [
  ruleCommitmentHigh,
  ruleLowFreeCash,
  ruleTighterMonth,
  ruleHeavyFutureMonth,
  ruleCostWillDecrease,
  ruleInstallmentsEnding,
  ruleHighRecurring,
  ruleCategoryGrowth,
  ruleMonthlyExpenseVariation,
  ruleHealthyMargin,
  ruleActiveInstallments,
  ruleFuturePressure,
];

import type { FinancialInsight, InsightSeverity } from "./insightTypes";

const SEVERITY_WEIGHT: Record<InsightSeverity, number> = {
  danger: 400,
  warning: 300,
  info: 200,
  positive: 100,
};

export function rankInsights(insights: FinancialInsight[]): FinancialInsight[] {
  return [...insights].sort((a, b) => {
    const sw = SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity];
    if (sw !== 0) return sw;
    return b.priority - a.priority;
  });
}

export function pickPrimaryInsight(insights: FinancialInsight[]): FinancialInsight | null {
  const ranked = rankInsights(insights);
  return ranked[0] ?? null;
}

export function pickTopInsights(
  insights: FinancialInsight[],
  limit = 5
): FinancialInsight[] {
  return rankInsights(insights).slice(0, limit);
}

/** Mensagem única para card legado (dashboard). */
export function formatInsightsAsBrief(insights: FinancialInsight[]): string {
  const top = pickTopInsights(insights, 2);
  if (top.length === 0) {
    return "Ainda estou aprendendo o teu ritmo financeiro — regista mais movimentos para insights melhores.";
  }
  if (top.length === 1) return top[0]!.message;
  return `${top[0]!.message} ${top[1]!.message}`;
}

export const SEVERITY_STYLES: Record<
  InsightSeverity,
  { border: string; bg: string; text: string; dot: string }
> = {
  danger: {
    border: "border-red-500/35",
    bg: "bg-red-500/10",
    text: "text-red-300",
    dot: "bg-red-400",
  },
  warning: {
    border: "border-amber-500/35",
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    dot: "bg-amber-400",
  },
  positive: {
    border: "border-emerald-500/35",
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  info: {
    border: "border-violet-500/25",
    bg: "bg-violet-500/8",
    text: "text-violet-200",
    dot: "bg-violet-400",
  },
};

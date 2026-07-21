import { buildFinancialInsightContext, buildInsightContextFromPayload } from "./insightContextBuilder";
import { pickPrimaryInsight, pickTopInsights, rankInsights } from "./insightFormatter";
import { INSIGHT_RULES } from "./insightRules";
import type {
  BuildInsightContextInput,
  FinancialInsight,
  FinancialInsightContext,
} from "./insightTypes";

export type { BuildInsightContextInput, FinancialInsight, FinancialInsightContext };
export {
  buildFinancialInsightContext,
  buildInsightContextFromPayload,
} from "./insightContextBuilder";
export { pickPrimaryInsight, pickTopInsights, rankInsights, formatInsightsAsBrief } from "./insightFormatter";
export { INSIGHT_RULES } from "./insightRules";
export type { InsightSeverity, InsightCategory } from "./insightTypes";

/**
 * Executa todas as regras determinísticas e deduplica por id.
 * Preparado para extensão: regras plugáveis, scoring externo, IA futura.
 */
export function generateFinancialInsights(
  ctx: FinancialInsightContext
): FinancialInsight[] {
  const seen = new Set<string>();
  const out: FinancialInsight[] = [];

  for (const rule of INSIGHT_RULES) {
    const hit = rule(ctx);
    if (!hit || seen.has(hit.id)) continue;
    seen.add(hit.id);
    out.push(hit);
  }

  return rankInsights(out);
}

export function generateInsightsFromBuildInput(
  input: BuildInsightContextInput
): FinancialInsight[] {
  const ctx = buildFinancialInsightContext(input);
  return generateFinancialInsights(ctx);
}

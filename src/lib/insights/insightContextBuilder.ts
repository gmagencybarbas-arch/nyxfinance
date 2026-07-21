import type { ProfileIdentity } from "@/components/profile/types";
import { buildMonthPlanning, buildProjection } from "@/lib/planning/planningEngine";
import { monthKeyFromDate, monthLabel, parseMonthKey } from "@/lib/planning/planningFormat";
import type { PlanningApiPayload } from "@/lib/planning/types";
import type { BuildInsightContextInput, FinancialInsightContext } from "./insightTypes";

function addMonthsKey(key: string, delta: number): string {
  const { year, month } = parseMonthKey(key);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function sumExpensesByCategory(
  txs: BuildInsightContextInput["recentTransactions"],
  monthKey: string
): Record<string, number> {
  const { year, month } = parseMonthKey(monthKey);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  const out: Record<string, number> = {};
  if (!txs) return out;
  for (const t of txs) {
    if (t.type !== "EXPENSE") continue;
    const d = new Date(t.occurredAt);
    if (d < start || d > end) continue;
    const cat = t.category?.trim() || "Outros";
    out[cat] = (out[cat] ?? 0) + Math.abs(t.amount);
  }
  return out;
}

export function buildFinancialInsightContext(
  input: BuildInsightContextInput
): FinancialInsightContext {
  const refDate = input.refDate ?? new Date();
  const focusMonthKey = input.focusMonthKey;
  const payload = input.payload;
  const identity = input.identity ?? null;
  const projectionMonths = input.projectionMonths ?? 8;

  const current = buildMonthPlanning(focusMonthKey, payload, identity, refDate);
  const projection = buildProjection(focusMonthKey, projectionMonths, payload, identity, refDate);
  const prevKey = addMonthsKey(focusMonthKey, -1);

  const categorySpendCurrent = sumExpensesByCategory(
    input.recentTransactions,
    focusMonthKey
  );
  const categorySpendPrevious = sumExpensesByCategory(
    input.recentTransactions,
    prevKey
  );

  const totalExpenseCurrent = Object.values(categorySpendCurrent).reduce((s, v) => s + v, 0);
  const totalExpensePrevious = Object.values(categorySpendPrevious).reduce((s, v) => s + v, 0);

  return {
    refDate,
    focusMonthKey,
    focusMonthLabel: monthLabel(focusMonthKey),
    current,
    projection,
    installmentPlans: current.installmentPlans,
    recurringBills: payload.recurringBills ?? [],
    rawInstallmentPlans: payload.installmentPlans ?? [],
    categorySpendCurrent,
    categorySpendPrevious,
    totalExpenseCurrent,
    totalExpensePrevious,
  };
}

/** Contexto mínimo só com payload (sem histórico de transações por categoria). */
export function buildInsightContextFromPayload(
  payload: PlanningApiPayload,
  identity: ProfileIdentity | null,
  refDate = new Date()
): FinancialInsightContext {
  return buildFinancialInsightContext({
    payload,
    focusMonthKey: monthKeyFromDate(refDate),
    identity,
    refDate,
  });
}

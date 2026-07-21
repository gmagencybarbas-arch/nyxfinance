import type {
  InstallmentPlanView,
  MonthPlanningView,
  PlanningApiInstallmentPlan,
  PlanningApiPayload,
  PlanningApiRecurringBill,
  ProjectionMonth,
} from "@/lib/planning/types";

export type InsightSeverity = "info" | "positive" | "warning" | "danger";

export type InsightCategory =
  | "commitment"
  | "installment"
  | "recurring"
  | "spending"
  | "projection"
  | "balance";

/** Insight pronto para UI, notificações ou voz (futuro). */
export interface FinancialInsight {
  id: string;
  severity: InsightSeverity;
  message: string;
  category: InsightCategory;
  /** Maior = mais relevante no ranking. */
  priority: number;
  /** Metadados para IA contextual / memória Nyx (futuro). */
  meta?: Record<string, unknown>;
}

/** Entrada determinística do motor — derivada de planejamento + transações. */
export interface FinancialInsightContext {
  refDate: Date;
  focusMonthKey: string;
  focusMonthLabel: string;
  current: MonthPlanningView;
  projection: ProjectionMonth[];
  installmentPlans: InstallmentPlanView[];
  recurringBills: PlanningApiRecurringBill[];
  rawInstallmentPlans: PlanningApiInstallmentPlan[];
  categorySpendCurrent: Record<string, number>;
  categorySpendPrevious: Record<string, number>;
  totalExpenseCurrent: number;
  totalExpensePrevious: number;
}

export type InsightRule = (ctx: FinancialInsightContext) => FinancialInsight | null;

export type BuildInsightContextInput = {
  payload: PlanningApiPayload;
  focusMonthKey: string;
  identity: import("@/components/profile/types").ProfileIdentity | null;
  /** Transações recentes (ex.: hook useTransactions) para variação de gastos. */
  recentTransactions?: {
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    amount: number;
    category: string;
    occurredAt: string;
  }[];
  projectionMonths?: number;
  refDate?: Date;
};

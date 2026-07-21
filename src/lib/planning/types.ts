/** Linha da grade mensal (planilha inteligente). */
export type PlanningRowType = "recurring" | "installment" | "manual";

export type PlanningRowStatus = "paid" | "pending" | "scheduled";

export interface PlanningRow {
  id: string;
  category: string;
  description: string;
  amount: number;
  dueDate: string;
  dueLabel: string;
  status: PlanningRowStatus;
  type: PlanningRowType;
  progress?: { current: number; total: number };
}

export type IncomeSource = "transactions" | "monthly_income" | "salary_range" | "none";

export interface MonthSummary {
  expectedIncome: number;
  expectedExpenses: number;
  committed: number;
  freeEstimate: number;
  committedPercent: number;
  incomeSource: IncomeSource;
}

export interface InstallmentPlanView {
  planId: string;
  description: string;
  category: string;
  currentInstallment: number;
  totalInstallments: number;
  amountPerMonth: number;
  remaining: number;
  endMonthLabel: string;
  progressPercent: number;
  trackInCommitments: boolean;
}

export interface ProjectionMonth {
  monthKey: string;
  label: string;
  expectedIncome: number;
  committed: number;
  expectedExpenses: number;
  freeEstimate: number;
  isHeavy?: boolean;
}

export interface MonthPlanningView {
  monthKey: string;
  label: string;
  summary: MonthSummary;
  rows: PlanningRow[];
  installmentPlans: InstallmentPlanView[];
}

export interface PlanningApiRecurringBill {
  id: string;
  title: string;
  amount: number;
  category: string;
  dueDay: number;
  active: boolean;
}

export interface PlanningApiPayload {
  rangeStart: string;
  rangeEnd: string;
  transactions: PlanningApiTransaction[];
  installmentPlans: PlanningApiInstallmentPlan[];
  recurringBills: PlanningApiRecurringBill[];
}

export interface PlanningApiTransaction {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  category: string;
  description: string | null;
  status: string;
  occurredAt: string;
  installmentPlanId: string | null;
  installmentNumber: number | null;
  isInstallment: boolean;
}

export interface PlanningApiInstallmentPlan {
  id: string;
  description: string | null;
  totalInstallments: number;
  installmentAmount: number;
  firstDueDate: string;
  trackInCommitments: boolean;
  transactions: {
    id: string;
    installmentNumber: number | null;
    amount: number;
    occurredAt: string;
    status: string;
    category: string;
  }[];
}

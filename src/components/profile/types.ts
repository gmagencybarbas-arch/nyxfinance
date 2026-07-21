// Profile types – tipagem forte

export type NyxPlan = "free" | "prime";

export type SalaryRange =
  | "ate_1k"
  | "1k_3k"
  | "3k_5k"
  | "5k_10k"
  | "10k_20k"
  | "20k_plus";

export interface ProfileIdentity {
  fullName: string;
  profession: string;
  jobTitle: string;
  salaryRange: SalaryRange;
  payday: number; // 1-31
  financialGoal?: string;
  /** Renda mensal exata (R$). Se informada, prevalece sobre a faixa salarial no planejamento. */
  monthlyIncome?: number | null;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  color: string; // hex para barra de progresso
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  dueDay: number; // 1-31
  categoryId: string;
  /** false = pausado no planejamento mensal (default: ativo). */
  active?: boolean;
}

export interface NotificationSettings {
  salaryReminder: boolean;
  expenseReminders: boolean;
  weeklySummary: boolean;
  highSpendingAlert: boolean;
}

export interface ReferralProgress {
  invitedCount: number;
  activatedCount: number; // ≥10 lançamentos
  myTransactionsCount: number; // ≥10 lançamentos
}

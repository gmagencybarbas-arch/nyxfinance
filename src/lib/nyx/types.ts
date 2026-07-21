/** Tipos da interpretação inteligente da Nyx (OpenAI → revisão → persistência). */

export type NyxIntent =
  | "CREATE_TRANSACTION"
  | "CREATE_INSTALLMENT"
  | "CREATE_RECURRING_BILL"
  | "SIMULATE_PURCHASE"
  | "ASK_FINANCIAL_QUESTION"
  | "CASUAL_CONVERSATION"
  | "CORRECT_PENDING_ACTIONS"
  | "CONFIRM_PENDING_ACTIONS"
  | "CANCEL_PENDING_ACTIONS"
  | "NEEDS_CLARIFICATION";

export type NyxActionKind =
  | "TRANSACTION"
  | "INSTALLMENT_PLAN"
  | "RECURRING_BILL"
  | "SIMULATION";

export type NyxPlanningType = "ACTUAL" | "PLANNED" | "COMMITTED";

export type NyxTransactionDraft = {
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  description: string;
  category: string;
  occurredAt: string;
  planningType: NyxPlanningType;
};

export type NyxInstallmentDraft = {
  description: string;
  category: string;
  installmentAmount: number;
  totalInstallments: number;
  totalAmount: number;
  firstDueDate: string;
  trackInCommitments: boolean;
};

export type NyxRecurringDraft = {
  title: string;
  amount: number;
  category: string;
  dueDay: number;
  active: boolean;
};

export type NyxAction = {
  actionId: string;
  kind: NyxActionKind;
  confidence: number;
  missingFields: string[];
  transaction: NyxTransactionDraft | null;
  installment: NyxInstallmentDraft | null;
  recurringBill: NyxRecurringDraft | null;
};

export type NyxPendingBatch = {
  batchId: string;
  actions: NyxAction[];
  createdAt: string;
};

export type NyxInterpretation = {
  intent: NyxIntent;
  reply: string;
  requiresConfirmation: boolean;
  actions: NyxAction[];
  pendingBatch: NyxPendingBatch | null;
  missingFields: string[];
  /** true quando API usou fallback do parser determinístico */
  usedFallback?: boolean;
  source?: "openai" | "deterministic" | "local";
};

export type NyxInterpretRequest = {
  message: string;
  currentDate: string;
  timezone: string;
  userCategories: string[];
  pendingBatch: NyxPendingBatch | null;
  /** Personalidade da personagem ativa (nunca vem da skin). */
  personalityKey?: "nyx" | "eva";
};

export type NyxVisualState =
  | "master"
  | "typing"
  | "thinking"
  | "sucess"
  | "error"
  | "cigarro01"
  | "cigarro02";

export type PersistActionResult = {
  actionId: string;
  ok: boolean;
  id?: string;
  error?: string;
};

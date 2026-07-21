import { parseTransactionInput } from "@/ai/transactionParser";
import type {
  NyxAction,
  NyxInterpretation,
  NyxPendingBatch,
  NyxPlanningType,
} from "./types";
import { cleanDescription } from "./normalize";

function toIsoLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

function inferPlanningType(occurredAt: Date, now = new Date()): NyxPlanningType {
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOccurred = new Date(
    occurredAt.getFullYear(),
    occurredAt.getMonth(),
    occurredAt.getDate()
  );
  if (startOccurred.getTime() <= startToday.getTime()) return "ACTUAL";
  return "PLANNED";
}

/**
 * Converte o parser determinístico em NyxInterpretation.
 * Usado quando OpenAI falha / está sem chave.
 */
export async function interpretWithDeterministicParser(
  message: string,
  userCategories: string[],
  pendingBatch: NyxPendingBatch | null
): Promise<NyxInterpretation> {
  const result = await parseTransactionInput(message, userCategories);

  if (result.status === "error") {
    return {
      intent: "NEEDS_CLARIFICATION",
      reply: result.reason || "Não entendi. Manda valor e o que foi?",
      requiresConfirmation: false,
      actions: [],
      pendingBatch,
      missingFields: ["amount"],
      usedFallback: true,
      source: "deterministic",
    };
  }

  const p = result.data;
  const actions: NyxAction[] = [];

  if (p.installmentPlan && !p.installmentAwaitingFirstDue && p.installmentPlan.firstDueDate) {
    const each = Math.abs(p.installmentPlan.amountEach);
    const n = p.installmentPlan.count;
    actions.push({
      actionId: `det_${Date.now()}`,
      kind: "INSTALLMENT_PLAN",
      confidence: p.confidence,
      missingFields: result.status === "needs_confirmation" ? result.missing : [],
      transaction: null,
      recurringBill: null,
      installment: {
        description: cleanDescription(p.description),
        category: p.categorySuggested || "Outros",
        installmentAmount: each,
        totalInstallments: n,
        totalAmount: each * n,
        firstDueDate: toIsoLocal(p.installmentPlan.firstDueDate),
        trackInCommitments: false,
      },
    });
  } else if (p.recurringBill && (p.recurringAccepted || result.status === "needs_confirmation")) {
    actions.push({
      actionId: `det_${Date.now()}`,
      kind: "RECURRING_BILL",
      confidence: p.confidence,
      missingFields: [],
      transaction: null,
      installment: null,
      recurringBill: {
        title: cleanDescription(p.description),
        amount: Math.abs(p.amount),
        category: p.categorySuggested || "Casa",
        dueDay: p.recurringBill.dayOfMonth,
        active: true,
      },
    });
  } else if (!p._nyxAwaiting && !p.installmentAwaitingFirstDue) {
    actions.push({
      actionId: `det_${Date.now()}`,
      kind: "TRANSACTION",
      confidence: p.confidence,
      missingFields: result.status === "needs_confirmation" ? result.missing : [],
      installment: null,
      recurringBill: null,
      transaction: {
        type: p.type === "income" ? "INCOME" : "EXPENSE",
        amount: Math.abs(p.amount),
        description: cleanDescription(p.description),
        category: p.categorySuggested || "Outros",
        occurredAt: toIsoLocal(p.date),
        planningType: inferPlanningType(p.date),
      },
    });
  }

  if (actions.length === 0) {
    return {
      intent: "NEEDS_CLARIFICATION",
      reply: "Preciso de mais um detalhe pra fechar isso.",
      requiresConfirmation: false,
      actions: [],
      pendingBatch,
      missingFields: result.status === "needs_confirmation" ? result.missing : [],
      usedFallback: true,
      source: "deterministic",
    };
  }

  const batch: NyxPendingBatch = {
    batchId: `batch_det_${Date.now()}`,
    actions,
    createdAt: new Date().toISOString(),
  };

  const reply =
    actions.length === 1
      ? "Peguei isso. Confere pra mim."
      : `Encontrei ${actions.length} movimentos. Dá uma olhada antes de eu salvar.`;

  return {
    intent:
      actions[0].kind === "INSTALLMENT_PLAN"
        ? "CREATE_INSTALLMENT"
        : actions[0].kind === "RECURRING_BILL"
          ? "CREATE_RECURRING_BILL"
          : "CREATE_TRANSACTION",
    reply,
    requiresConfirmation: true,
    actions,
    pendingBatch: batch,
    missingFields: [],
    usedFallback: true,
    source: "deterministic",
  };
}

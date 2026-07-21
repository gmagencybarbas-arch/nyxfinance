import type { NyxAction, NyxPendingBatch, NyxPlanningType } from "./types";
import { nyxInterpretationSchema, type NyxInterpretationParsed } from "./schemas";

const DIRTY_DESC =
  /\b(gastei|paguei|comprei|recebi|enviar|confirma|confirmar|lancei|lancei)\b/gi;

export function cleanDescription(raw: string): string {
  let s = raw.trim();
  s = s.replace(DIRTY_DESC, "").replace(/\s{2,}/g, " ").trim();
  s = s.replace(/^[\s,.\-–—]+|[\s,.\-–—]+$/g, "").trim();
  if (!s) return "Lançamento";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function planningTypeToStatus(
  planningType: NyxPlanningType
): "COMPLETED" | "PENDING" {
  return planningType === "ACTUAL" ? "COMPLETED" : "PENDING";
}

export function ensureActionIds(actions: NyxAction[]): NyxAction[] {
  return actions.map((a, i) => ({
    ...a,
    actionId: a.actionId?.trim() || `act_${Date.now()}_${i}`,
  }));
}

export function normalizeInterpretation(
  raw: NyxInterpretationParsed
): NyxInterpretationParsed {
  const actions = ensureActionIds(raw.actions).map((a) => {
    if (a.transaction) {
      return {
        ...a,
        transaction: {
          ...a.transaction,
          amount: Math.abs(a.transaction.amount),
          description: cleanDescription(a.transaction.description),
          category: a.transaction.category.trim() || "Outros",
        },
        installment: null,
        recurringBill: null,
      };
    }
    if (a.installment) {
      const each = Math.abs(a.installment.installmentAmount);
      const n = a.installment.totalInstallments;
      return {
        ...a,
        transaction: null,
        recurringBill: null,
        installment: {
          ...a.installment,
          installmentAmount: each,
          totalAmount: Number((each * n).toFixed(2)),
          description: cleanDescription(a.installment.description),
          category: a.installment.category.trim() || "Outros",
        },
      };
    }
    if (a.recurringBill) {
      return {
        ...a,
        transaction: null,
        installment: null,
        recurringBill: {
          ...a.recurringBill,
          amount: Math.abs(a.recurringBill.amount),
          title: cleanDescription(a.recurringBill.title),
          category: a.recurringBill.category.trim() || "Casa",
          dueDay: Math.min(31, Math.max(1, Math.round(a.recurringBill.dueDay))),
        },
      };
    }
    return a;
  });

  let pendingBatch = raw.pendingBatch;
  if (pendingBatch) {
    pendingBatch = {
      ...pendingBatch,
      batchId: pendingBatch.batchId || `batch_${Date.now()}`,
      actions: ensureActionIds(pendingBatch.actions.map((a) => {
        const match = actions.find((x) => x.actionId === a.actionId);
        return match ?? a;
      })),
    };
  }

  // Se tem actions para revisão e pendingBatch null, monta lote
  const needsBatch =
    raw.requiresConfirmation &&
    actions.length > 0 &&
    [
      "CREATE_TRANSACTION",
      "CREATE_INSTALLMENT",
      "CREATE_RECURRING_BILL",
      "CORRECT_PENDING_ACTIONS",
      "SIMULATE_PURCHASE",
    ].includes(raw.intent);

  if (needsBatch && (!pendingBatch || pendingBatch.actions.length === 0)) {
    pendingBatch = {
      batchId: `batch_${Date.now()}`,
      actions,
      createdAt: new Date().toISOString(),
    };
  }

  return nyxInterpretationSchema.parse({
    ...raw,
    actions,
    pendingBatch,
    reply: raw.reply.trim().slice(0, 800),
  });
}

export function validateActionCompleteness(action: NyxAction): string[] {
  const missing: string[] = [];
  if (action.kind === "TRANSACTION") {
    if (!action.transaction) missing.push("transaction");
    else {
      if (!(action.transaction.amount > 0)) missing.push("amount");
      if (!action.transaction.description?.trim()) missing.push("description");
      if (!action.transaction.category?.trim()) missing.push("category");
      if (Number.isNaN(Date.parse(action.transaction.occurredAt))) missing.push("occurredAt");
    }
  }
  if (action.kind === "INSTALLMENT_PLAN") {
    if (!action.installment) missing.push("installment");
    else {
      if (!(action.installment.installmentAmount > 0)) missing.push("installmentAmount");
      if (!(action.installment.totalInstallments >= 2)) missing.push("totalInstallments");
      if (Number.isNaN(Date.parse(action.installment.firstDueDate))) missing.push("firstDueDate");
    }
  }
  if (action.kind === "RECURRING_BILL") {
    if (!action.recurringBill) missing.push("recurringBill");
    else {
      if (!(action.recurringBill.amount > 0)) missing.push("amount");
      if (!(action.recurringBill.dueDay >= 1 && action.recurringBill.dueDay <= 31)) {
        missing.push("dueDay");
      }
    }
  }
  return missing;
}

export function mergePendingAfterConfirm(
  batch: NyxPendingBatch,
  confirmedIds: string[]
): NyxPendingBatch | null {
  const remaining = batch.actions.filter((a) => !confirmedIds.includes(a.actionId));
  if (remaining.length === 0) return null;
  return { ...batch, actions: remaining };
}

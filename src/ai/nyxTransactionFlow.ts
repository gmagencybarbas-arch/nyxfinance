/**
 * Orquestração do fluxo de transação por linguagem natural no Nyx.
 * Parser é a única fonte de verdade; sem APIs de IA pagas.
 */

import {
  parseNaturalDate,
  parseTransactionInput,
  normalizeText,
  extractAmount,
  type ParsedTransaction,
} from "./transactionParser";
import { nextCalendarDateForDayOfMonth } from "./installmentRecurring";
import {
  getNyxSuccessMessage,
  getNyxErrorMessage,
  getNyxInstallmentAmountQuestion,
  getNyxInstallmentCountQuestion,
  buildInstallmentFirstDueQuestion,
  buildInstallmentConfirmSummary,
  buildSimpleTransactionConfirm,
  buildRecurringChoiceMessage,
  buildRecurringConfirmSummary,
} from "./nyxPersonality";

export type NyxFlowOptions = {
  userDisplayName?: string | null;
};

export type NyxFlowState =
  | "idle"
  | "awaiting_confirmation"
  | "awaiting_missing_info"
  | "awaiting_installment_first_due"
  | "awaiting_installment_amount"
  | "awaiting_installment_count"
  | "awaiting_recurring_choice";

export type NyxFlowResponse = {
  reply: string;
  state: NyxFlowState;
  parsed?: ParsedTransaction;
  /**
   * Parcelamento confirmado: a UI deve perguntar compromissos mensais (botões)
   * **antes** de persistir e antes da descrição opcional.
   */
  deferInstallmentCommitmentPrompt?: boolean;
};

const CONFIRM_KEYWORDS = [
  "sim",
  "confirmar",
  "pode",
  "ok",
  "isso",
  "isso mesmo",
  "confirmo",
  "quero",
  "beleza",
];

function normalizeForConfirm(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

function isConfirmationMessage(message: string): boolean {
  const n = normalizeForConfirm(message);
  return CONFIRM_KEYWORDS.some((k) => n === k || n.startsWith(k + " ") || n.endsWith(" " + k));
}

function isSimpleYes(message: string): boolean {
  const n = normalizeForConfirm(message);
  return /^(sim|quero|pode|ok|aceito|isso)\b/.test(n) || n === "s";
}

function isSimpleNo(message: string): boolean {
  const n = normalizeForConfirm(message);
  return /^(não|nao|n)\b/.test(n) || n === "n" || /^não quero|^nao quero|^dispensa/.test(n);
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Math.abs(value));
}

function formatDateForConfirm(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "hoje";
  if (diff === 1) return "ontem";
  if (diff === 2) return "anteontem";
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
}

function buildConfirmationReply(
  parsed: ParsedTransaction,
  options?: NyxFlowOptions
): string {
  const amountStr = formatCurrencyBRL(parsed.amount);

  if (parsed.installmentPlan && !parsed.installmentAwaitingFirstDue) {
    const plan = parsed.installmentPlan;
    return buildInstallmentConfirmSummary({
      count: plan.count,
      eachFormatted: formatCurrencyBRL(plan.amountEach),
      description: parsed.description,
      firstDueFormatted: formatDateForConfirm(parsed.date),
    });
  }

  if (parsed.recurringBill) {
    return buildRecurringConfirmSummary({
      description: parsed.description,
      amountFormatted: amountStr,
      dayOfMonth: parsed.recurringBill.dayOfMonth,
      nextDueFormatted: formatDateForConfirm(parsed.date),
      asCommitment: parsed.recurringAccepted === true,
    });
  }

  const showDate = parsed.showDateInConfirmation === true;
  const dateSuffix = showDate
    ? ` dia **${formatDateForConfirm(parsed.date)}**`
    : undefined;

  return buildSimpleTransactionConfirm({
    type: parsed.type,
    amountFormatted: amountStr,
    description: parsed.description,
    dateSuffix,
  });
}

function buildInstallmentAskFirstDueReply(
  p: ParsedTransaction,
  options?: NyxFlowOptions
): string {
  const plan = p.installmentPlan!;
  return buildInstallmentFirstDueQuestion({
    count: plan.count,
    eachFormatted: formatCurrencyBRL(plan.amountEach),
    description: p.description,
    userDisplayName: options?.userDisplayName,
  });
}

function buildRecurringChoiceReply(p: ParsedTransaction): string {
  return buildRecurringChoiceMessage({
    description: p.description,
    amountFormatted: formatCurrencyBRL(p.amount),
    dayOfMonth: p.recurringBill!.dayOfMonth,
    nextDueFormatted: formatDateForConfirm(p.date),
  });
}

function mergeInstallmentFirstDue(
  pending: ParsedTransaction,
  message: string
): { ok: boolean; parsed?: ParsedTransaction } {
  const trimmed = message.trim();
  if (!trimmed) return { ok: false };
  if (isConfirmationMessage(trimmed)) return { ok: false };
  const ref = new Date();
  const due = parseNaturalDate(normalizeText(trimmed), ref);
  const plan = pending.installmentPlan;
  if (!plan) return { ok: false };
  const next: ParsedTransaction = {
    ...pending,
    date: due,
    installmentPlan: { ...plan, firstDueDate: due },
    installmentAwaitingFirstDue: false,
    _nyxAwaiting: undefined,
  };
  return { ok: true, parsed: next };
}

function mergeInstallmentAmount(
  pending: ParsedTransaction,
  message: string
): { ok: boolean; parsed?: ParsedTransaction } {
  const trimmed = message.trim();
  if (!trimmed) return { ok: false };
  if (isConfirmationMessage(trimmed)) return { ok: false };
  const { value, rawFound } = extractAmount(normalizeText(trimmed));
  if (value == null || !rawFound || value <= 0) return { ok: false };
  const count = pending.pendingInstallmentCount;
  if (count == null || count < 2) return { ok: false };
  const ref = new Date();
  const plan = { count, amountEach: value };
  const dueDay = pending.pendingInstallmentFirstDueDay;
  let next: ParsedTransaction = {
    ...pending,
    amount: -Math.abs(value),
    installmentPlan: plan,
    pendingInstallmentCount: undefined,
    pendingInstallmentFirstDueDay: undefined,
    _nyxAwaiting: undefined,
    installmentAwaitingFirstDue: false,
  };
  if (dueDay != null) {
    const due = nextCalendarDateForDayOfMonth(dueDay, ref);
    next = {
      ...next,
      date: due,
      installmentPlan: { ...plan, firstDueDate: due },
      installmentAwaitingFirstDue: false,
    };
  } else {
    next = {
      ...next,
      installmentAwaitingFirstDue: true,
      _nyxAwaiting: "installment_first_due",
      date: startOfLocalDay(ref),
    };
  }
  return { ok: true, parsed: next };
}

function mergeInstallmentCount(
  pending: ParsedTransaction,
  message: string
): { ok: boolean; parsed?: ParsedTransaction } {
  const trimmed = message.trim();
  if (!trimmed) return { ok: false };
  if (isConfirmationMessage(trimmed)) return { ok: false };
  const nMatch = trimmed.match(/\b(\d{1,3})\b/);
  if (!nMatch) return { ok: false };
  const count = parseInt(nMatch[1], 10);
  if (count < 2 || count > 360) return { ok: false };
  const each = pending.pendingInstallmentAmountEach;
  if (each == null || each <= 0) return { ok: false };
  const ref = new Date();
  const plan = { count, amountEach: each };
  const dueDay = pending.pendingInstallmentFirstDueDay;
  let next: ParsedTransaction = {
    ...pending,
    installmentPlan: plan,
    pendingInstallmentAmountEach: undefined,
    pendingInstallmentFirstDueDay: undefined,
    _nyxAwaiting: undefined,
    installmentAwaitingFirstDue: false,
    amount: -Math.abs(each),
  };
  if (dueDay != null) {
    const due = nextCalendarDateForDayOfMonth(dueDay, ref);
    next = {
      ...next,
      date: due,
      installmentPlan: { ...plan, firstDueDate: due },
      installmentAwaitingFirstDue: false,
    };
  } else {
    next = {
      ...next,
      installmentAwaitingFirstDue: true,
      _nyxAwaiting: "installment_first_due",
      date: startOfLocalDay(ref),
    };
  }
  return { ok: true, parsed: next };
}

/**
 * Remove metadados de diálogo antes de persistir (campos opcionais ignorados pela API).
 */
export function stripNyxDialogMeta(p: ParsedTransaction): ParsedTransaction {
  const {
    _nyxAwaiting: _a,
    pendingInstallmentCount: _pc,
    pendingInstallmentFirstDueDay: _pd,
    pendingInstallmentAmountEach: _pa,
    ...rest
  } = p;
  return rest;
}

/**
 * Processa mensagem do usuário e retorna resposta estruturada para a UI.
 */
export async function handleNyxMessage(
  message: string,
  userCategories: string[],
  pendingTransaction?: ParsedTransaction | null,
  options?: NyxFlowOptions
): Promise<NyxFlowResponse> {
  const trimmed = message.trim();
  if (!trimmed) {
    return {
      reply: "Manda uma mensagem quando quiser registrar uma transação.",
      state: "idle",
    };
  }

  if (pendingTransaction?._nyxAwaiting === "installment_amount") {
    const merged = mergeInstallmentAmount(pendingTransaction, trimmed);
    if (!merged.ok || !merged.parsed) {
      return {
        reply:
          "Não captei o valor da parcela. Manda só o número (ex.: **350** ou **89,90**).",
        state: "awaiting_installment_amount",
        parsed: pendingTransaction,
      };
    }
    if (merged.parsed._nyxAwaiting === "installment_first_due") {
      return {
        reply: buildInstallmentAskFirstDueReply(merged.parsed, options),
        state: "awaiting_installment_first_due",
        parsed: merged.parsed,
      };
    }
    return {
      reply: buildConfirmationReply(merged.parsed, options),
      state: "awaiting_confirmation",
      parsed: merged.parsed,
    };
  }

  if (pendingTransaction?._nyxAwaiting === "installment_count") {
    const merged = mergeInstallmentCount(pendingTransaction, trimmed);
    if (!merged.ok || !merged.parsed) {
      return {
        reply:
          "Não captei o número de parcelas. Diz só o total (ex.: **12** ou **6 parcelas**).",
        state: "awaiting_installment_count",
        parsed: pendingTransaction,
      };
    }
    if (merged.parsed._nyxAwaiting === "installment_first_due") {
      return {
        reply: buildInstallmentAskFirstDueReply(merged.parsed, options),
        state: "awaiting_installment_first_due",
        parsed: merged.parsed,
      };
    }
    return {
      reply: buildConfirmationReply(merged.parsed, options),
      state: "awaiting_confirmation",
      parsed: merged.parsed,
    };
  }

  if (pendingTransaction?._nyxAwaiting === "installment_first_due") {
    const merged = mergeInstallmentFirstDue(pendingTransaction, trimmed);
    if (!merged.ok || !merged.parsed) {
      return {
        reply:
          "Não captei a data da primeira parcela. Diz só **dia 12** ou **12/02**, por favor.",
        state: "awaiting_installment_first_due",
        parsed: pendingTransaction,
      };
    }
    return {
      reply: buildConfirmationReply(merged.parsed, options),
      state: "awaiting_confirmation",
      parsed: merged.parsed,
    };
  }

  if (pendingTransaction?._nyxAwaiting === "recurring_choice") {
    if (isSimpleYes(trimmed)) {
      const next: ParsedTransaction = {
        ...pendingTransaction,
        recurringAccepted: true,
        _nyxAwaiting: undefined,
      };
      return {
        reply: buildConfirmationReply(next, options),
        state: "awaiting_confirmation",
        parsed: next,
      };
    }
    if (isSimpleNo(trimmed)) {
      const next: ParsedTransaction = {
        ...pendingTransaction,
        recurringAccepted: false,
        recurringBill: undefined,
        _nyxAwaiting: undefined,
      };
      return {
        reply:
          "Sem problema — trato como **lançamento avulso** deste mês.\n\n" +
          buildConfirmationReply(next, options),
        state: "awaiting_confirmation",
        parsed: next,
      };
    }
    return {
      reply:
        "Só preciso de um **sim** ou **não** — recorrente ou só este mês.",
      state: "awaiting_recurring_choice",
      parsed: pendingTransaction,
    };
  }

  if (pendingTransaction != null && isConfirmationMessage(trimmed)) {
    const defer =
      !!(
        pendingTransaction.installmentPlan &&
        !pendingTransaction.installmentAwaitingFirstDue
      );
    return {
      reply: getNyxSuccessMessage(),
      state: "idle",
      parsed: pendingTransaction,
      deferInstallmentCommitmentPrompt: defer,
    };
  }

  const result = await parseTransactionInput(trimmed, userCategories);

  if (result.status === "error") {
    return {
      reply: getNyxErrorMessage(),
      state: "awaiting_missing_info",
    };
  }

  const data = result.data;

  if (data._nyxAwaiting === "installment_amount") {
    return {
      reply: getNyxInstallmentAmountQuestion(),
      state: "awaiting_installment_amount",
      parsed: data,
    };
  }

  if (data._nyxAwaiting === "installment_count") {
    return {
      reply: getNyxInstallmentCountQuestion(),
      state: "awaiting_installment_count",
      parsed: data,
    };
  }

  if (data._nyxAwaiting === "installment_first_due") {
    return {
      reply: buildInstallmentAskFirstDueReply(data, options),
      state: "awaiting_installment_first_due",
      parsed: data,
    };
  }

  if (data._nyxAwaiting === "recurring_choice") {
    return {
      reply: buildRecurringChoiceReply(data),
      state: "awaiting_recurring_choice",
      parsed: data,
    };
  }

  return {
    reply: buildConfirmationReply(data, options),
    state: "awaiting_confirmation",
    parsed: data,
  };
}

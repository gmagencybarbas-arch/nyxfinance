/**
 * Extensão Nyx → contas recorrentes (uso futuro no chat).
 * Quando o utilizador confirmar compromisso mensal após um lançamento recorrente,
 * chamar createRecurringBillFromNyx no servidor ou POST /api/recurring-bills no cliente.
 */

import type { CreateRecurringBillInput } from "./types";

export type NyxRecurringSuggestion = {
  title: string;
  amount: number;
  category: string;
  dueDay: number;
};

/** Monta payload a partir de dados já parseados no fluxo Nyx. */
export function buildRecurringFromNyxDialog(
  suggestion: NyxRecurringSuggestion
): CreateRecurringBillInput {
  return {
    title: suggestion.title.trim(),
    amount: suggestion.amount,
    category: suggestion.category.trim() || "Outros",
    dueDay: Math.min(31, Math.max(1, suggestion.dueDay)),
    active: true,
  };
}

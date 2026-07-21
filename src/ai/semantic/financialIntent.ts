import type { FinancialIntent } from "./types";

const INCOME_HINTS = [
  "recebi",
  "ganhei",
  "entrou",
  "salario",
  "salário",
  "freelance",
] as const;

const EXPENSE_HINTS = [
  "gastei",
  "paguei",
  "comprei",
  "pago",
  "gasto",
  "acabei de pagar",
  "acabei de comprar",
] as const;

export function extractFinancialIntent(ascii: string): FinancialIntent {
  const hasIncome = INCOME_HINTS.some((k) => ascii.includes(normalizeAscii(k)));
  const hasExpense = EXPENSE_HINTS.some((k) => ascii.includes(normalizeAscii(k)));
  if (hasIncome && !hasExpense) return { type: "income" };
  if (hasExpense && !hasIncome) return { type: "expense" };
  return { type: "unknown" };
}

function normalizeAscii(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

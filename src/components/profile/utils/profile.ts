import type { SalaryRange } from "../types";

export const SALARY_RANGE_LABELS: Record<SalaryRange, string> = {
  ate_1k: "Até R$ 1.000",
  "1k_3k": "R$ 1.000 - R$ 3.000",
  "3k_5k": "R$ 3.000 - R$ 5.000",
  "5k_10k": "R$ 5.000 - R$ 10.000",
  "10k_20k": "R$ 10.000 - R$ 20.000",
  "20k_plus": "Acima de R$ 20.000",
};

export function formatCurrency(value: number, decimals = 0): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

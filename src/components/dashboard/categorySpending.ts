import type { Transaction } from "@/components/transactions/mockData";
import { MOCK_CATEGORY_COLORS } from "@/components/transactions/mockData";

export interface CategorySpending {
  category: string;
  total: number;
  percentage: number;
  color: string;
}

/**
 * Agrega despesas por categoria.
 * Apenas type === "expense" e amount < 0; total = soma de Math.abs(amount).
 * Ordenado por total desc; opcionalmente limita ao top N.
 */
export function computeCategorySpending(
  transactions: Transaction[],
  options?: { limit?: number }
): CategorySpending[] {
  const byCategory: Record<string, number> = {};
  let totalExpenses = 0;

  for (const t of transactions) {
    if (t.type !== "expense" || t.amount >= 0) continue;
    const abs = Math.abs(t.amount);
    byCategory[t.category] = (byCategory[t.category] ?? 0) + abs;
    totalExpenses += abs;
  }

  const result: CategorySpending[] = Object.entries(byCategory).map(
    ([category, total]) => ({
      category,
      total,
      percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
      color: MOCK_CATEGORY_COLORS[category] ?? "#64748b",
    })
  );

  const sorted = result.sort((a, b) => b.total - a.total);
  const limit = options?.limit;
  return limit != null && limit > 0 ? sorted.slice(0, limit) : sorted;
}

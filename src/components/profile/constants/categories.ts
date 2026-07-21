import type { ExpenseCategory } from "../types";

export const DEFAULT_INCOME_CATEGORIES: ExpenseCategory[] = [
  { id: "salario", name: "Salário", color: "#22c55e", description: "Salário fixo" },
  { id: "freelance", name: "Freelance", color: "#a78bfa", description: "Trabalhos avulsos" },
  { id: "investimentos", name: "Investimentos", color: "#06b6d4", description: "Rendimentos e dividendos" },
  { id: "outros_receita", name: "Outros", color: "#64748b", description: "Demais receitas" },
];

export const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: "alimentacao", name: "Alimentação", color: "#a78bfa", description: "Supermercado, restaurantes" },
  { id: "transporte", name: "Transporte", color: "#22c55e", description: "Combustível, Uber, transporte público" },
  { id: "entretenimento", name: "Entretenimento", color: "#8b5cf6", description: "Streaming, lazer" },
  { id: "casa", name: "Casa", color: "#6366f1", description: "Aluguel, contas, manutenção" },
  { id: "saude", name: "Saúde", color: "#ec4899", description: "Plano de saúde, medicamentos" },
  { id: "outros", name: "Outros", color: "#64748b", description: "Demais gastos" },
];

export const STORAGE_CATEGORIES_KEY = "nyx_expense_categories";

export const PRESET_COLORS = [
  "#a78bfa", "#22c55e", "#8b5cf6", "#6366f1", "#ec4899", "#64748b",
  "#f59e0b", "#06b6d4", "#84cc16", "#ef4444",
];

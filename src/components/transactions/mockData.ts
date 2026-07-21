export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  dateLabel: string;
  category: string;
  /** ISO completo (occurred_at) para horário e detalhe */
  occurredAtIso?: string;
  status?: string;
}

/** Ordenar por date (ISO) desc - inclui jan e fev para testar filtros */
export const MOCK_TRANSACTIONS_FULL: Transaction[] = [
  // Fevereiro 2026
  { id: "1", description: "Salário", amount: 4500, type: "income", date: "2026-02-15", dateLabel: "Hoje", category: "Salário" },
  { id: "2", description: "Supermercado", amount: -320.5, type: "expense", date: "2026-02-15", dateLabel: "Hoje", category: "Alimentação" },
  { id: "3", description: "Uber", amount: -28, type: "expense", date: "2026-02-15", dateLabel: "Hoje", category: "Transporte" },
  { id: "4", description: "Freelance", amount: 800, type: "income", date: "2026-02-14", dateLabel: "Ontem", category: "Freelance" },
  { id: "5", description: "Streaming", amount: -54.9, type: "expense", date: "2026-02-14", dateLabel: "Ontem", category: "Entretenimento" },
  { id: "6", description: "Combustível", amount: -180, type: "expense", date: "2026-02-14", dateLabel: "Ontem", category: "Transporte" },
  { id: "7", description: "Almoço", amount: -45, type: "expense", date: "2026-02-13", dateLabel: "13/02", category: "Alimentação" },
  { id: "8", description: "Renda", amount: -1200, type: "expense", date: "2026-02-13", dateLabel: "13/02", category: "Casa" },
  { id: "9", description: "Venda produto", amount: 350, type: "income", date: "2026-02-12", dateLabel: "12/02", category: "Outros" },
  { id: "10", description: "Farmacia", amount: -89.9, type: "expense", date: "2026-02-12", dateLabel: "12/02", category: "Saúde" },
  { id: "11", description: "Cinema", amount: -60, type: "expense", date: "2026-02-11", dateLabel: "11/02", category: "Entretenimento" },
  { id: "12", description: "Investimento retorno", amount: 120, type: "income", date: "2026-02-10", dateLabel: "10/02", category: "Investimentos" },
  // Janeiro 2026 (para testar filtro "mês anterior")
  { id: "13", description: "Salário", amount: 4500, type: "income", date: "2026-01-31", dateLabel: "31/01", category: "Salário" },
  { id: "14", description: "Supermercado", amount: -280, type: "expense", date: "2026-01-28", dateLabel: "28/01", category: "Alimentação" },
  { id: "15", description: "Internet", amount: -99, type: "expense", date: "2026-01-15", dateLabel: "15/01", category: "Casa" },
];

/** Dados para gráfico area/wave do Monthly Overview */
export const MOCK_MONTHLY_WAVE = [
  { day: "1", value: 1200 },
  { day: "5", value: 3500 },
  { day: "10", value: 2100 },
  { day: "15", value: 4925 },
  { day: "20", value: 4100 },
  { day: "28", value: 4925 },
];

export const MOCK_MONTHLY_TOTAL = 4925.6;
export const MOCK_MONTHLY_VARIATION = 12.4;

export const MOCK_NYX_QUICK_INSIGHT =
  "Gastos com alimentação acima da média. Nyx sugere definir limite semanal.";

export const MOCK_CATEGORY_COLORS: Record<string, string> = {
  Alimentação: "#a78bfa",
  Transporte: "#22c55e",
  Entretenimento: "#8b5cf6",
  Casa: "#6366f1",
  Saúde: "#ec4899",
  Outros: "#64748b",
  Salário: "#22c55e",
  Freelance: "#a78bfa",
  Investimentos: "#22c55e",
};

export const MOCK_BALANCE = 4925.6;

export const MOCK_TRANSACTIONS = [
  { id: "1", description: "Salário", amount: 4500, type: "income" as const, date: "Hoje", category: "Salário" },
  { id: "2", description: "Supermercado", amount: -320.5, type: "expense" as const, date: "Ontem", category: "Alimentação" },
  { id: "3", description: "Freelance", amount: 800, type: "income" as const, date: "02/02", category: "Freelance" },
  { id: "4", description: "Streaming", amount: -54.9, type: "expense" as const, date: "01/02", category: "Entretenimento" },
  { id: "5", description: "Combustível", amount: -180, type: "expense" as const, date: "01/02", category: "Transporte" },
];

export const MOCK_EXPENSE_BY_CATEGORY = [
  { name: "Alimentação", value: 1200, color: "#a78bfa" },
  { name: "Transporte", value: 450, color: "#22c55e" },
  { name: "Entretenimento", value: 280, color: "#8b5cf6" },
  { name: "Casa", value: 650, color: "#6366f1" },
  { name: "Outros", value: 320, color: "#64748b" },
];

export const MOCK_YEAR_SUMMARY = [
  { month: "Jan", ganhos: 5200, gastos: 3800 },
  { month: "Fev", ganhos: 5300, gastos: 4100 },
  { month: "Mar", ganhos: 5400, gastos: 3900 },
  { month: "Abr", ganhos: 5500, gastos: 4200 },
  { month: "Mai", ganhos: 5600, gastos: 4400 },
  { month: "Jun", ganhos: 5700, gastos: 4300 },
  { month: "Jul", ganhos: 5800, gastos: 4500 },
  { month: "Ago", ganhos: 5900, gastos: 4600 },
  { month: "Set", ganhos: 6000, gastos: 4700 },
  { month: "Out", ganhos: 6100, gastos: 4800 },
  { month: "Nov", ganhos: 6200, gastos: 4900 },
  { month: "Dez", ganhos: 6300, gastos: 5100 },
];

export const MOCK_MONTH_SUMMARY = Array.from({ length: 28 }, (_, i) => ({
  day: `${i + 1}`,
  ganhos: Math.round(150 + Math.random() * 200),
  gastos: Math.round(80 + Math.random() * 120),
}));

export const MOCK_CATEGORIES = [
  { id: "1", name: "Alimentação", amount: 1200, percentage: 32, color: "#a78bfa" },
  { id: "2", name: "Transporte", amount: 450, percentage: 12, color: "#22c55e" },
  { id: "3", name: "Entretenimento", amount: 280, percentage: 7, color: "#8b5cf6" },
  { id: "4", name: "Casa", amount: 650, percentage: 17, color: "#6366f1" },
  { id: "5", name: "Saúde", amount: 420, percentage: 11, color: "#ec4899" },
  { id: "6", name: "Outros", amount: 720, percentage: 19, color: "#64748b" },
];

export const MOCK_NYX_INSIGHT =
  "Seus gastos com alimentação aumentaram 12% este mês. Que tal definir um limite semanal?";

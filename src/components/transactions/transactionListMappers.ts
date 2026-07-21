/**
 * Mapeamento entre API/Prisma e tipo UI Transaction.
 * Mantido em arquivo separado para tipagem forte e reuso.
 */

import type { Transaction } from "./mockData";

export interface ApiTransactionRow {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  currency: string;
  category: string;
  description: string | null;
  status: string;
  occurredAt: string;
}

function formatDateLabel(dateKey: string): string {
  const d = new Date(dateKey);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
}

function toDateString(occurredAt: string): string {
  return occurredAt.slice(0, 10);
}

/**
 * Converte uma linha da API para o tipo Transaction da UI.
 * amount na UI: positivo para income, negativo para expense (convenção do mock).
 */
export function apiRowToTransaction(row: ApiTransactionRow): Transaction {
  const dateStr = toDateString(row.occurredAt);
  const isIncome = row.type === "INCOME";
  const amount = isIncome ? row.amount : -row.amount;
  return {
    id: row.id,
    description: row.description?.trim() || row.category,
    amount,
    type: isIncome ? "income" : "expense",
    date: dateStr,
    dateLabel: formatDateLabel(dateStr),
    category: row.category,
    occurredAtIso: row.occurredAt,
    status: row.status,
  };
}

export function apiRowsToTransactions(rows: ApiTransactionRow[]): Transaction[] {
  return rows.filter((r) => r.status !== "CANCELED").map(apiRowToTransaction);
}

import type { PlanningRow } from "@/lib/planning/types";
import type { Transaction } from "@/components/transactions/mockData";

export function planningRowToTransaction(row: PlanningRow): Transaction {
  return {
    id: row.id,
    description: row.description,
    amount: -Math.abs(row.amount),
    type: "expense",
    date: row.dueDate.slice(0, 10),
    dateLabel: row.dueLabel,
    category: row.category,
    occurredAtIso: row.dueDate,
    status:
      row.status === "paid"
        ? "COMPLETED"
        : row.status === "scheduled"
          ? "SCHEDULED"
          : "PENDING",
  };
}

export function isPlanningRowDeletable(row: PlanningRow): boolean {
  return row.type === "manual" || row.type === "installment";
}

export function isPlanningRowStatusUpdatable(row: PlanningRow): boolean {
  return row.type === "manual" || row.type === "installment";
}

export function planningStatusLabel(status: PlanningRow["status"]): string {
  if (status === "paid") return "Pago";
  if (status === "scheduled") return "Previsto";
  return "Pendente";
}

export function planningDeleteHint(row: PlanningRow): string | undefined {
  if (row.type === "installment" && row.progress) {
    return `Remove só a parcela ${row.progress.current}/${row.progress.total}. As outras parcelas do plano continuam.`;
  }
  return undefined;
}

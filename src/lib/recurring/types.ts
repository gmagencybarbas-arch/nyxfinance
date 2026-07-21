/** DTO de conta recorrente (API ↔ cliente ↔ planejamento). Valor em BRL (> 0). */
export interface RecurringBillDto {
  id: string;
  title: string;
  amount: number;
  category: string;
  dueDay: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecurringBillInput {
  title: string;
  amount: number;
  category: string;
  dueDay: number;
  active?: boolean;
}

export interface UpdateRecurringBillInput {
  title?: string;
  amount?: number;
  category?: string;
  dueDay?: number;
  active?: boolean;
}

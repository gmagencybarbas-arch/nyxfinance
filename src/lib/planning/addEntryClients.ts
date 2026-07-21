import type { CreateRecurringBillInput, RecurringBillDto } from "@/lib/recurring/types";

async function parseError(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return body.error ?? fallback;
}

export async function createTransactionEntry(input: {
  type: "INCOME" | "EXPENSE";
  amount: number;
  category: string;
  description: string;
  occurredAt: string;
}): Promise<string> {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: input.type,
      amount: input.amount,
      category: input.category,
      description: input.description,
      occurredAt: input.occurredAt,
    }),
  });
  if (!res.ok) {
    throw new Error(await parseError(res, "Não foi possível salvar o lançamento"));
  }
  const data = (await res.json()) as { id?: string };
  if (!data.id) throw new Error("Resposta inválida ao criar lançamento");
  return data.id;
}

/** @deprecated use createTransactionEntry */
export async function createExpenseTransaction(input: {
  amount: number;
  category: string;
  description: string;
  occurredAt: string;
}): Promise<string> {
  return createTransactionEntry({ ...input, type: "EXPENSE" });
}

export async function createInstallmentPlan(input: {
  category: string;
  description: string;
  totalInstallments: number;
  installmentAmount: number;
  firstDueDate: string;
  trackInCommitments: boolean;
}): Promise<{ planId: string; firstTransactionId: string }> {
  const res = await fetch("/api/installment-plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res, "Não foi possível criar o parcelamento"));
  const data = (await res.json()) as { planId?: string; firstTransactionId?: string };
  if (!data.planId || !data.firstTransactionId) {
    throw new Error("Resposta inválida ao criar parcelamento");
  }
  return { planId: data.planId, firstTransactionId: data.firstTransactionId };
}

export async function createRecurringBill(
  input: CreateRecurringBillInput
): Promise<RecurringBillDto> {
  const res = await fetch("/api/recurring-bills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res, "Não foi possível criar a conta mensal"));
  return (await res.json()) as RecurringBillDto;
}

/**
 * Criação de plano de parcelamento + transações (uma por vencimento mensal).
 */

import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";

function toDecimal(v: number | string | Decimal): Decimal {
  if (v instanceof Decimal) return v;
  return new Decimal(v);
}

/** Mesma lógica que nextCalendarDateForDayOfMonth por offset em meses a partir de uma data base. */
export function addCalendarMonths(base: Date, delta: number): Date {
  const y = base.getFullYear();
  const m = base.getMonth();
  const d = base.getDate();
  const nm = m + delta;
  const last = new Date(y, nm + 1, 0).getDate();
  return new Date(y, nm, Math.min(d, last), base.getHours(), base.getMinutes(), 0, 0);
}

export interface CreateInstallmentPlanInput {
  userId: string;
  tenantId: string;
  description?: string | null;
  category: string;
  totalInstallments: number;
  installmentAmount: number | string | Decimal;
  firstDueDate: Date;
  trackInCommitments?: boolean;
}

export interface CreateInstallmentPlanResult {
  planId: string;
  firstTransactionId: string;
}

export async function createInstallmentPlanWithTransactions(
  input: CreateInstallmentPlanInput
): Promise<CreateInstallmentPlanResult> {
  const n = input.totalInstallments;
  if (n < 2 || n > 360) throw new Error("Número de parcelas inválido");
  const per = toDecimal(input.installmentAmount);
  if (per.lte(0)) throw new Error("Valor da parcela inválido");
  const total = per.mul(n);

  return prisma.$transaction(async (tx) => {
    const t = tx as typeof tx & {
      installmentPlan: { create: (args: { data: object; select: object }) => Promise<{ id: string }> };
    };

    const plan = await t.installmentPlan.create({
      data: {
        userId: input.userId,
        tenantId: input.tenantId,
        description: input.description?.trim() ?? null,
        totalInstallments: n,
        installmentAmount: per,
        totalAmount: total,
        firstDueDate: input.firstDueDate,
        trackInCommitments: input.trackInCommitments ?? false,
      },
      select: { id: true },
    });

    const baseDesc = input.description?.trim() || "Parcelamento";
    let firstId = "";

    for (let i = 0; i < n; i++) {
      const occurredAt = addCalendarMonths(input.firstDueDate, i);
      const label = `${baseDesc} (${i + 1}/${n})`;
      const row = await tx.transaction.create({
        data: {
          userId: input.userId,
          tenantId: input.tenantId,
          type: "EXPENSE",
          amount: per,
          category: input.category.trim(),
          description: label,
          status: "COMPLETED",
          occurredAt,
          installmentPlanId: plan.id,
          installmentNumber: i + 1,
          isInstallment: true,
        // Campos de parcelamento exigem Prisma Client regenerado após migração.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        select: { id: true },
      });
      if (i === 0) firstId = row.id;
    }

    return { planId: plan.id, firstTransactionId: firstId };
  });
}

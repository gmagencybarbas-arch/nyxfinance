import { prisma } from "@/lib/prisma";
import { listRecurringBills } from "@/lib/recurring/recurringBill.service";
import type { PlanningApiPayload } from "./types";

/** Carrega transações e planos num intervalo (para projeção multi-mês). */
export async function fetchPlanningPayload(
  userId: string,
  rangeStart: Date,
  rangeEnd: Date
): Promise<PlanningApiPayload> {
  const [transactions, installmentPlans, recurringBills] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        occurredAt: { gte: rangeStart, lte: rangeEnd },
      },
      orderBy: { occurredAt: "asc" },
      select: {
        id: true,
        type: true,
        amount: true,
        category: true,
        description: true,
        status: true,
        occurredAt: true,
        installmentPlanId: true,
        installmentNumber: true,
        isInstallment: true,
      },
    }),
    prisma.installmentPlan.findMany({
      where: { userId },
      orderBy: { firstDueDate: "desc" },
      select: {
        id: true,
        description: true,
        totalInstallments: true,
        installmentAmount: true,
        firstDueDate: true,
        trackInCommitments: true,
        transactions: {
          orderBy: { installmentNumber: "asc" },
          select: {
            id: true,
            installmentNumber: true,
            amount: true,
            occurredAt: true,
            status: true,
            category: true,
          },
        },
      },
    }),
    listRecurringBills(userId),
  ]);

  return {
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      category: t.category,
      description: t.description,
      status: t.status,
      occurredAt: t.occurredAt.toISOString(),
      installmentPlanId: t.installmentPlanId,
      installmentNumber: t.installmentNumber,
      isInstallment: t.isInstallment,
    })),
    installmentPlans: installmentPlans.map((p) => ({
      id: p.id,
      description: p.description,
      totalInstallments: p.totalInstallments,
      installmentAmount: Number(p.installmentAmount),
      firstDueDate: p.firstDueDate.toISOString(),
      trackInCommitments: p.trackInCommitments,
      transactions: p.transactions.map((t) => ({
        id: t.id,
        installmentNumber: t.installmentNumber,
        amount: Number(t.amount),
        occurredAt: t.occurredAt.toISOString(),
        status: t.status,
        category: t.category,
      })),
    })),
    recurringBills: recurringBills.map((b) => ({
      id: b.id,
      title: b.title,
      amount: b.amount,
      category: b.category,
      dueDay: b.dueDay,
      active: b.active,
    })),
  };
}

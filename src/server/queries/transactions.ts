/**
 * Acesso a dados de transações (server-side).
 * Usa PrismaClient; tipagem forte; modular.
 */

import { prisma } from "@/lib/prisma";

export interface TransactionRow {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  currency: string;
  category: string;
  description: string | null;
  status: string;
  occurredAt: Date;
}

const LIMIT = 50;

export interface GetTransactionsByUserOptions {
  from?: Date;
  to?: Date;
}

/**
 * Lista transações do usuário: ordenação por occurred_at DESC, limit 50.
 * Opcionalmente filtra por período (from/to).
 */
export async function getTransactionsByUser(
  userId: string,
  options?: GetTransactionsByUserOptions
): Promise<TransactionRow[]> {
  const where: { userId: string; occurredAt?: { gte?: Date; lte?: Date } } = {
    userId,
  };
  if (options?.from != null || options?.to != null) {
    where.occurredAt = {};
    if (options.from != null) where.occurredAt.gte = options.from;
    if (options.to != null) where.occurredAt.lte = options.to;
  }

  const rows = await prisma.transaction.findMany({
    where,
    orderBy: { occurredAt: "desc" },
    take: LIMIT,
    select: {
      id: true,
      type: true,
      amount: true,
      currency: true,
      category: true,
      description: true,
      status: true,
      occurredAt: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    amount: Number(r.amount),
    currency: r.currency,
    category: r.category,
    description: r.description,
    status: r.status,
    occurredAt: r.occurredAt,
  }));
}

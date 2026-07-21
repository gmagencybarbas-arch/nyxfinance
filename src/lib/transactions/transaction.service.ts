/**
 * NYX — Transaction service
 * Rules: amount always stored > 0; type controls financial signal (INCOME/EXPENSE/TRANSFER).
 * Cursor-based pagination, no N+1, ready for scale.
 */

import { Decimal } from "@prisma/client/runtime/library";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { TransactionType, TransactionStatus } from "@prisma/client";

export type { TransactionType, TransactionStatus };

const ZERO = new Decimal(0);

/** Input: amount must be > 0. EXPENSE is stored as positive; type carries the signal. */
export interface CreateTransactionInput {
  userId: string;
  tenantId: string;
  type: TransactionType;
  amount: string | number | Decimal;
  currency?: string;
  category: string;
  description?: string | null;
  status?: TransactionStatus;
  occurredAt: Date;
}

/** Cursor for pagination: id + occurredAt for stable ordering. */
export interface TransactionCursor {
  id: string;
  occurredAt: Date;
}

export interface ListUserTransactionsOptions {
  userId: string;
  tenantId: string;
  limit?: number;
  cursor?: TransactionCursor | null;
  type?: TransactionType | null;
  status?: TransactionStatus | null;
  from?: Date | null;
  to?: Date | null;
}

export interface SpendingByCategoryItem {
  category: string;
  total: Decimal;
  count: number;
}

function toDecimal(v: string | number | Decimal): Decimal {
  if (v instanceof Decimal) return v;
  return new Decimal(v);
}

/** Ensures amount is stored positive. Caller must pass positive amount; we reject <= 0. */
function normalizeAmount(
  amount: string | number | Decimal,
  type: TransactionType
): Decimal {
  const d = toDecimal(amount);
  if (d.lte(ZERO)) {
    throw new Error("Transaction amount must be greater than 0");
  }
  // EXPENSE stored as positive; type indicates direction
  return d;
}

/** Status padrão: despesas planejadas começam pendentes; receitas passadas já contam como realizadas. */
export function defaultTransactionStatus(
  type: TransactionType,
  occurredAt: Date
): TransactionStatus {
  if (type === "EXPENSE") return "PENDING";
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return occurredAt.getTime() > endOfToday.getTime() ? "PENDING" : "COMPLETED";
}

export async function createTransaction(
  input: CreateTransactionInput
): Promise<{ id: string }> {
  const amount = normalizeAmount(input.amount, input.type);
  const currency = input.currency ?? "BRL";
  const occurredAt = input.occurredAt instanceof Date ? input.occurredAt : new Date(input.occurredAt);
  const status = input.status ?? defaultTransactionStatus(input.type, occurredAt);

  const tx = await prisma.transaction.create({
    data: {
      userId: input.userId,
      tenantId: input.tenantId,
      type: input.type,
      amount,
      currency,
      category: input.category.trim(),
      description: input.description?.trim() ?? null,
      status,
      occurredAt,
    },
    select: { id: true },
  });

  return { id: tx.id };
}

/** Cursor-based list; uses index (userId, occurredAt desc). No N+1. */
export async function listUserTransactions(
  options: ListUserTransactionsOptions
) {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const andParts: object[] = [];
  if (options.from != null || options.to != null) {
    const range: { gte?: Date; lte?: Date } = {};
    if (options.from != null) range.gte = options.from;
    if (options.to != null) range.lte = options.to;
    andParts.push({ occurredAt: range });
  }
  if (options.cursor) {
    andParts.push({
      OR: [
        { occurredAt: { lt: options.cursor.occurredAt } },
        {
          occurredAt: options.cursor.occurredAt,
          id: { lt: options.cursor.id },
        },
      ],
    });
  }

  const where: Prisma.TransactionWhereInput = {
    userId: options.userId,
    tenantId: options.tenantId,
    ...(options.type != null && { type: options.type }),
    ...(options.status != null && { status: options.status }),
    ...(andParts.length > 0 && { AND: andParts }),
  };

  const [items, totalCount] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      select: {
        id: true,
        type: true,
        amount: true,
        currency: true,
        category: true,
        description: true,
        status: true,
        occurredAt: true,
        createdAt: true,
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  const hasMore = items.length > limit;
  const list = hasMore ? items.slice(0, limit) : items;
  const nextCursor: TransactionCursor | null =
    hasMore && list.length > 0
      ? {
          id: list[list.length - 1]!.id,
          occurredAt: list[list.length - 1]!.occurredAt,
        }
      : null;

  return {
    items: list,
    nextCursor,
    hasMore,
    total: totalCount,
  };
}

/** Balance = sum(INCOME) - sum(EXPENSE) for COMPLETED. TRANSFER can be handled as out-of-scope or neutral per product. */
export async function getBalance(
  userId: string,
  tenantId: string,
  asOf?: Date | null
): Promise<Decimal> {
  const where = {
    userId,
    tenantId,
    status: "COMPLETED" as const,
  };
  if (asOf != null) {
    (where as { occurredAt?: { lte: Date } }).occurredAt = { lte: asOf };
  }

  const rows = await prisma.transaction.groupBy({
    by: ["type"],
    where,
    _sum: { amount: true },
  });

  let income = ZERO;
  let expense = ZERO;
  for (const r of rows) {
    const sum = r._sum.amount ?? ZERO;
    if (r.type === "INCOME") income = income.add(sum);
    else if (r.type === "EXPENSE") expense = expense.add(sum);
    // TRANSFER: treat as neutral for balance (or adjust per product rules)
  }
  return income.sub(expense);
}

/** Spending by category: COMPLETED EXPENSE only, grouped. */
export async function getSpendingByCategory(
  userId: string,
  tenantId: string,
  from?: Date | null,
  to?: Date | null
): Promise<SpendingByCategoryItem[]> {
  const where: Parameters<typeof prisma.transaction.groupBy>[0]["where"] = {
    userId,
    tenantId,
    type: "EXPENSE",
    status: "COMPLETED",
  };
  if (from != null || to != null) {
    where.occurredAt = {};
    if (from != null) (where.occurredAt as { gte?: Date }).gte = from;
    if (to != null) (where.occurredAt as { lte?: Date }).lte = to;
  }

  const groups = await prisma.transaction.groupBy({
    by: ["category"],
    where,
    _sum: { amount: true },
    _count: { id: true },
  });

  return groups.map((g) => ({
    category: g.category,
    total: (g._sum.amount ?? ZERO) as Decimal,
    count: g._count.id,
  }));
}

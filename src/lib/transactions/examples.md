# Transaction service — example usage

## Env

```bash
# Prisma (Supabase Postgres or any PostgreSQL)
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
```

## Create transaction

```ts
import { createTransaction } from "@/lib/transactions";

// EXPENSE: pass positive amount; type carries the signal
await createTransaction({
  userId: authUser.id,
  tenantId: tenant.id,
  type: "EXPENSE",
  amount: 99.9,
  currency: "BRL",
  category: "alimentacao",
  description: "Supermercado",
  status: "COMPLETED",
  occurredAt: new Date(),
});

// INCOME
await createTransaction({
  userId: authUser.id,
  tenantId: tenant.id,
  type: "INCOME",
  amount: 5000,
  category: "salario",
  occurredAt: new Date(),
});
```

## List (cursor pagination)

```ts
import { listUserTransactions } from "@/lib/transactions";

const page1 = await listUserTransactions({
  userId: authUser.id,
  tenantId: tenant.id,
  limit: 20,
});
// page1.items, page1.nextCursor, page1.hasMore, page1.total

const page2 = await listUserTransactions({
  userId: authUser.id,
  tenantId: tenant.id,
  limit: 20,
  cursor: page1.nextCursor ?? undefined,
});

// Filter by type and date range
const expenses = await listUserTransactions({
  userId: authUser.id,
  tenantId: tenant.id,
  limit: 50,
  type: "EXPENSE",
  status: "COMPLETED",
  from: new Date("2025-01-01"),
  to: new Date("2025-01-31"),
});
```

## Balance

```ts
import { getBalance } from "@/lib/transactions";

const balance = await getBalance(userId, tenantId);
// Decimal: sum(INCOME) - sum(EXPENSE), COMPLETED only

const balanceAsOf = await getBalance(userId, tenantId, new Date("2025-01-15"));
```

## Spending by category

```ts
import { getSpendingByCategory } from "@/lib/transactions";

const byCategory = await getSpendingByCategory(
  userId,
  tenantId,
  new Date("2025-01-01"),
  new Date("2025-01-31")
);
// [{ category: "alimentacao", total: Decimal, count: 12 }, ...]
```

## Example raw Prisma queries (reference)

```ts
import { prisma } from "@/lib/prisma";

// Last 10 transactions for user (uses index userId + occurredAt desc)
const last = await prisma.transaction.findMany({
  where: { userId, tenantId, status: "COMPLETED" },
  orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
  take: 10,
  select: { id: true, type: true, amount: true, category: true, occurredAt: true },
});

// Aggregate by type in one query
const sums = await prisma.transaction.groupBy({
  by: ["type"],
  where: { userId, tenantId, status: "COMPLETED" },
  _sum: { amount: true },
});
```

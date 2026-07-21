import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import type {
  CreateRecurringBillInput,
  RecurringBillDto,
  UpdateRecurringBillInput,
} from "./types";

function toDto(row: {
  id: string;
  title: string;
  amount: Decimal;
  category: string;
  dueDay: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): RecurringBillDto {
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    category: row.category,
    dueDay: row.dueDay,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function normalizeAmount(amount: number): Decimal {
  const d = new Decimal(amount);
  if (d.lte(0)) throw new Error("Valor deve ser maior que zero");
  return d;
}

function clampDueDay(day: number): number {
  const d = Math.round(day);
  if (d < 1 || d > 31) throw new Error("Dia de vencimento deve ser entre 1 e 31");
  return d;
}

export async function listRecurringBills(userId: string): Promise<RecurringBillDto[]> {
  const rows = await prisma.recurringBill.findMany({
    where: { userId },
    orderBy: [{ active: "desc" }, { dueDay: "asc" }, { title: "asc" }],
  });
  return rows.map(toDto);
}

export async function createRecurringBill(
  userId: string,
  tenantId: string,
  input: CreateRecurringBillInput
): Promise<RecurringBillDto> {
  const title = input.title.trim();
  if (!title) throw new Error("Título é obrigatório");
  const category = input.category.trim();
  if (!category) throw new Error("Categoria é obrigatória");

  const row = await prisma.recurringBill.create({
    data: {
      userId,
      tenantId,
      title,
      amount: normalizeAmount(input.amount),
      category,
      dueDay: clampDueDay(input.dueDay),
      active: input.active ?? true,
    },
  });
  return toDto(row);
}

export async function updateRecurringBill(
  userId: string,
  id: string,
  input: UpdateRecurringBillInput
): Promise<RecurringBillDto | null> {
  const existing = await prisma.recurringBill.findFirst({
    where: { id, userId },
  });
  if (!existing) return null;

  const row = await prisma.recurringBill.update({
    where: { id },
    data: {
      ...(input.title != null ? { title: input.title.trim() } : {}),
      ...(input.amount != null ? { amount: normalizeAmount(input.amount) } : {}),
      ...(input.category != null ? { category: input.category.trim() } : {}),
      ...(input.dueDay != null ? { dueDay: clampDueDay(input.dueDay) } : {}),
      ...(input.active != null ? { active: input.active } : {}),
    },
  });
  return toDto(row);
}

export async function deleteRecurringBill(userId: string, id: string): Promise<boolean> {
  const existing = await prisma.recurringBill.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) return false;
  await prisma.recurringBill.delete({ where: { id } });
  return true;
}

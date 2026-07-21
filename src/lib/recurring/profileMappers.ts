import type { RecurringExpense, ExpenseCategory } from "@/components/profile/types";
import type { CreateRecurringBillInput, RecurringBillDto } from "./types";

const LEGACY_STORAGE_KEY = "nyx_profile_recurring";

/** UI do perfil (centavos) → API (BRL). */
export function profileItemToCreateInput(
  item: Omit<RecurringExpense, "id">,
  categories: ExpenseCategory[]
): CreateRecurringBillInput {
  const category =
    categories.find((c) => c.id === item.categoryId)?.name ?? "Outros";
  return {
    title: item.name.trim(),
    amount: item.amount / 100,
    category,
    dueDay: item.dueDay,
    active: item.active !== false,
  };
}

/** API → UI do perfil (centavos + categoryId por nome). */
export function dtoToProfileItem(
  dto: RecurringBillDto,
  categories: ExpenseCategory[]
): RecurringExpense {
  const byName = categories.find(
    (c) => c.name.toLowerCase() === dto.category.toLowerCase()
  );
  const categoryId = byName?.id ?? categories[0]?.id ?? "outros";
  return {
    id: dto.id,
    name: dto.title,
    amount: Math.round(dto.amount * 100),
    dueDay: dto.dueDay,
    categoryId,
    active: dto.active,
  };
}

export function loadLegacyRecurringFromStorage(): Omit<RecurringExpense, "id">[] {
  if (typeof window === "undefined") return [];
  try {
    const s = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!s) return [];
    const parsed = JSON.parse(s) as RecurringExpense[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((r) => ({
      name: r.name,
      amount: r.amount,
      dueDay: r.dueDay,
      categoryId: r.categoryId,
      active: r.active !== false,
    }));
  } catch {
    return [];
  }
}

export function clearLegacyRecurringStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* noop */
  }
}

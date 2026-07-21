import type { ProfileIdentity, ExpenseCategory } from "@/components/profile/types";
import { MOCK_PROFILE_IDENTITY } from "@/components/profile/mocks/profile";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, STORAGE_CATEGORIES_KEY } from "@/components/profile/constants/categories";
import { generateId } from "@/components/profile/utils/profile";

export const STORAGE_IDENTITY = "nyx_profile_identity";

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const s = localStorage.getItem(key);
    return s ? { ...fallback, ...JSON.parse(s) } : fallback;
  } catch {
    return fallback;
  }
}

export function loadProfileIdentity(): ProfileIdentity {
  return loadJson(STORAGE_IDENTITY, MOCK_PROFILE_IDENTITY);
}

export function loadCategoryNameMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const c of DEFAULT_EXPENSE_CATEGORIES) {
    map[c.id] = c.name;
  }
  if (typeof window === "undefined") return map;
  try {
    const s = localStorage.getItem(STORAGE_CATEGORIES_KEY);
    if (s) {
      const custom = JSON.parse(s) as ExpenseCategory[];
      if (Array.isArray(custom)) {
        for (const c of custom) map[c.id] = c.name;
      }
    }
  } catch {
    /* noop */
  }
  return map;
}

/** Categorias de despesa (defaults + custom do localStorage). */
export function loadExpenseCategories(): ExpenseCategory[] {
  if (typeof window === "undefined") return [...DEFAULT_EXPENSE_CATEGORIES];
  try {
    const s = localStorage.getItem(STORAGE_CATEGORIES_KEY);
    if (!s) return [...DEFAULT_EXPENSE_CATEGORIES];
    const parsed = JSON.parse(s) as ExpenseCategory[];
    const custom = Array.isArray(parsed) ? parsed : [];
    const defaultIds = new Set(DEFAULT_EXPENSE_CATEGORIES.map((c) => c.id));
    const customOnly = custom.filter((c) => !defaultIds.has(c.id));
    return [...DEFAULT_EXPENSE_CATEGORIES, ...customOnly];
  } catch {
    return [...DEFAULT_EXPENSE_CATEGORIES];
  }
}

export function loadIncomeCategories(): ExpenseCategory[] {
  return [...DEFAULT_INCOME_CATEGORIES];
}

export function mergeProfileIdentity(
  local: ProfileIdentity,
  remote?: {
    displayName?: string | null;
    profession?: string | null;
    jobTitle?: string | null;
    salaryRange?: ProfileIdentity["salaryRange"] | null;
    payday?: number | null;
    financialGoal?: string | null;
  } | null
): ProfileIdentity {
  if (!remote) return local;
  return {
    ...local,
    fullName: remote.displayName?.trim() || local.fullName,
    profession: remote.profession ?? local.profession,
    jobTitle: remote.jobTitle ?? local.jobTitle,
    salaryRange: remote.salaryRange ?? local.salaryRange,
    payday: remote.payday ?? local.payday,
    financialGoal: remote.financialGoal ?? local.financialGoal,
    monthlyIncome: local.monthlyIncome,
  };
}

/** Persiste categoria custom e devolve a lista atualizada. */
export function persistCustomCategory(
  category: Omit<ExpenseCategory, "id">
): ExpenseCategory {
  const newCat: ExpenseCategory = { ...category, id: generateId() };
  const defaultIds = new Set(DEFAULT_EXPENSE_CATEGORIES.map((c) => c.id));
  const current = loadExpenseCategories();
  const customOnly = [...current.filter((c) => !defaultIds.has(c.id)), newCat];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(customOnly));
    } catch {
      /* noop */
    }
  }
  return newCat;
}

export function categoryIdToName(
  categories: ExpenseCategory[],
  categoryId: string
): string {
  return categories.find((c) => c.id === categoryId)?.name ?? "Outros";
}

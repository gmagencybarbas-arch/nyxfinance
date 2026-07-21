"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RecurringBillsDrawer } from "@/components/profile/RecurringBillsDrawer";
import { DEFAULT_EXPENSE_CATEGORIES, STORAGE_CATEGORIES_KEY } from "@/components/profile/constants/categories";
import type { ExpenseCategory, RecurringExpense } from "@/components/profile/types";
import { useRecurringBills } from "@/hooks/useRecurringBills";
import { useToast } from "@/contexts/ToastContext";
import {
  dtoToProfileItem,
  profileItemToCreateInput,
} from "@/lib/recurring/profileMappers";
import {
  loadExpenseCategories,
  persistCustomCategory,
} from "@/lib/planning/profileStorage";

interface EditRecurringBillsModalProps {
  open: boolean;
  onClose: () => void;
  /** Chamado após criar/remover/atualizar para atualizar o planejamento. */
  onChanged?: () => void;
}

/**
 * Mesmo drawer de despesas recorrentes do perfil (“Organização financeira”),
 * reutilizado pela engrenagem em Contas mensais no planejamento.
 */
export function EditRecurringBillsModal({
  open,
  onClose,
  onChanged,
}: EditRecurringBillsModalProps) {
  const toast = useToast();
  const recurringApi = useRecurringBills(open);
  const [categories, setCategories] = useState<ExpenseCategory[]>(() =>
    loadExpenseCategories()
  );

  useEffect(() => {
    if (open) {
      setCategories(loadExpenseCategories());
      void recurringApi.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao abrir
  }, [open]);

  const items = useMemo(
    () => recurringApi.items.map((d) => dtoToProfileItem(d, categories)),
    [recurringApi.items, categories]
  );

  const handleAdd = useCallback(
    async (item: Omit<RecurringExpense, "id">) => {
      try {
        await recurringApi.create(profileItemToCreateInput(item, categories));
        onChanged?.();
        toast.show("Conta mensal adicionada", "success");
      } catch (e) {
        toast.show(e instanceof Error ? e.message : "Erro ao adicionar", "error");
      }
    },
    [recurringApi, categories, onChanged, toast]
  );

  const handleUpdate = useCallback(
    async (id: string, item: Omit<RecurringExpense, "id">) => {
      try {
        await recurringApi.update(id, profileItemToCreateInput(item, categories));
        onChanged?.();
        toast.show("Conta atualizada", "success");
      } catch (e) {
        toast.show(e instanceof Error ? e.message : "Erro ao atualizar", "error");
      }
    },
    [recurringApi, categories, onChanged, toast]
  );

  const handleToggleActive = useCallback(
    async (id: string, active: boolean) => {
      try {
        await recurringApi.update(id, { active });
        onChanged?.();
        toast.show(active ? "Conta reativada" : "Conta pausada", "success");
      } catch (e) {
        toast.show(e instanceof Error ? e.message : "Erro ao atualizar", "error");
      }
    },
    [recurringApi, onChanged, toast]
  );

  const handleRemove = useCallback(
    async (id: string) => {
      try {
        await recurringApi.remove(id);
        onChanged?.();
        toast.show("Conta removida", "success");
      } catch (e) {
        toast.show(e instanceof Error ? e.message : "Erro ao remover", "error");
      }
    },
    [recurringApi, onChanged, toast]
  );

  const handleAddCategory = useCallback((category: Omit<ExpenseCategory, "id">) => {
    const added = persistCustomCategory(category);
    setCategories((prev) => {
      if (prev.some((c) => c.id === added.id)) return prev;
      const next = [...prev, added];
      try {
        const customOnly = next.filter(
          (c) => !DEFAULT_EXPENSE_CATEGORIES.some((d) => d.id === c.id)
        );
        localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(customOnly));
      } catch {
        /* noop */
      }
      return next;
    });
    return added;
  }, []);

  return (
    <RecurringBillsDrawer
      open={open}
      onClose={onClose}
      items={items}
      categories={categories}
      loading={recurringApi.loading}
      error={recurringApi.error}
      onAdd={(item) => void handleAdd(item)}
      onUpdate={(id, item) => void handleUpdate(id, item)}
      onRemove={(id) => void handleRemove(id)}
      onToggleActive={(id, active) => void handleToggleActive(id, active)}
      onAddCategory={handleAddCategory}
    />
  );
}

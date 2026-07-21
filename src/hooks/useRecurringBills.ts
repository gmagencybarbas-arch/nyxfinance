"use client";

import { useCallback, useEffect, useState } from "react";
import type { RecurringBillDto, CreateRecurringBillInput } from "@/lib/recurring/types";

export function useRecurringBills(enabled = true) {
  const [items, setItems] = useState<RecurringBillDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recurring-bills");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Falha ao carregar");
      }
      const data = (await res.json()) as { items: RecurringBillDto[] };
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const create = useCallback(async (input: CreateRecurringBillInput) => {
    const res = await fetch("/api/recurring-bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? "Falha ao criar");
    }
    const item = (await res.json()) as RecurringBillDto;
    setItems((prev) => [...prev, item].sort((a, b) => a.dueDay - b.dueDay));
    return item;
  }, []);

  const update = useCallback(
    async (id: string, patch: Partial<CreateRecurringBillInput> & { active?: boolean }) => {
      const res = await fetch(`/api/recurring-bills/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Falha ao atualizar");
      }
      const item = (await res.json()) as RecurringBillDto;
      setItems((prev) => prev.map((r) => (r.id === id ? item : r)));
      return item;
    },
    []
  );

  const remove = useCallback(async (id: string) => {
    const res = await fetch(`/api/recurring-bills/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? "Falha ao remover");
    }
    setItems((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
    create,
    update,
    remove,
    setItems,
  };
}

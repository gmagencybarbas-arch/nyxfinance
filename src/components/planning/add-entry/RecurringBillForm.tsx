"use client";

import { useState, useCallback } from "react";
import type { ExpenseCategory } from "@/components/profile/types";
import { categoryIdToName } from "@/lib/planning/profileStorage";
import { createRecurringBill } from "@/lib/planning/addEntryClients";
import { EntryCategorySelect } from "./EntryCategorySelect";
import { clampInt, inputClass, labelClass, parseBRLAmount } from "./formShared";

interface RecurringBillFormProps {
  categories: ExpenseCategory[];
  onAddCategory: (category: Omit<ExpenseCategory, "id">) => ExpenseCategory;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RecurringBillForm({
  categories,
  onAddCategory,
  onSuccess,
  onCancel,
}: RecurringBillFormProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "outros");
  const [dueDay, setDueDay] = useState("10");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = title.trim();
      const parsedAmount = parseBRLAmount(amount);
      const day = clampInt(dueDay, 1, 31, 10);

      if (!trimmed) {
        setError("Informe um título.");
        return;
      }
      if (parsedAmount == null) {
        setError("Informe um valor válido.");
        return;
      }

      setSaving(true);
      setError(null);
      try {
        await createRecurringBill({
          title: trimmed,
          amount: parsedAmount,
          category: categoryIdToName(categories, categoryId),
          dueDay: day,
          active,
        });
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar");
      } finally {
        setSaving(false);
      }
    },
    [title, amount, dueDay, active, categories, categoryId, onSuccess]
  );

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
      <div>
        <label htmlFor="rec-title" className={labelClass}>
          Título
        </label>
        <input
          id="rec-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Aluguel"
          className={inputClass}
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="rec-amount" className={labelClass}>
          Valor
        </label>
        <input
          id="rec-amount"
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d,.]/g, ""))}
          placeholder="Ex: 1500,00"
          className={inputClass}
        />
      </div>

      <EntryCategorySelect
        categories={categories}
        value={categoryId}
        onChange={setCategoryId}
        onAddCategory={onAddCategory}
      />

      <div>
        <label htmlFor="rec-due-day" className={labelClass}>
          Dia do vencimento
        </label>
        <select
          id="rec-due-day"
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value)}
          className={inputClass}
        >
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              Dia {d}
            </option>
          ))}
        </select>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 px-3.5 py-3">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-4 w-4 rounded border-[var(--border)] accent-[var(--nyx-gradient-start)]"
        />
        <span className="text-sm text-[var(--foreground)]">Ativa</span>
      </label>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 rounded-xl bg-[var(--muted)] py-3 text-sm font-medium text-[var(--foreground)] hover:opacity-90 disabled:opacity-50"
        >
          Voltar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-xl bg-gradient-to-r from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(167,139,250,0.25)] hover:opacity-95 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}

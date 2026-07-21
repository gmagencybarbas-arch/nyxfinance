"use client";

import { useState, useCallback } from "react";
import type { ExpenseCategory } from "@/components/profile/types";
import { categoryIdToName } from "@/lib/planning/profileStorage";
import { createTransactionEntry } from "@/lib/planning/addEntryClients";
import { EntryCategorySelect } from "./EntryCategorySelect";
import {
  dateInputToIso,
  inputClass,
  labelClass,
  parseBRLAmount,
  todayDateInputValue,
} from "./formShared";

type EntryType = "EXPENSE" | "INCOME";

interface ExpenseFormProps {
  categories: ExpenseCategory[];
  incomeCategories: ExpenseCategory[];
  onAddCategory: (category: Omit<ExpenseCategory, "id">) => ExpenseCategory;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ExpenseForm({
  categories,
  incomeCategories,
  onAddCategory,
  onSuccess,
  onCancel,
}: ExpenseFormProps) {
  const [entryType, setEntryType] = useState<EntryType>("EXPENSE");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "outros");
  const [date, setDate] = useState(todayDateInputValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCategories = entryType === "INCOME" ? incomeCategories : categories;

  const handleTypeChange = (type: EntryType) => {
    setEntryType(type);
    setCategoryId(type === "INCOME" ? (incomeCategories[0]?.id ?? "salario") : (categories[0]?.id ?? "outros"));
    setError(null);
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = title.trim();
      const parsedAmount = parseBRLAmount(amount);
      if (!trimmed) {
        setError("Informe um título.");
        return;
      }
      if (parsedAmount == null) {
        setError("Informe um valor válido.");
        return;
      }
      if (!date) {
        setError("Informe a data.");
        return;
      }

      setSaving(true);
      setError(null);
      try {
        await createTransactionEntry({
          type: entryType,
          amount: parsedAmount,
          category: categoryIdToName(activeCategories, categoryId),
          description: trimmed,
          occurredAt: dateInputToIso(date),
        });
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar");
      } finally {
        setSaving(false);
      }
    },
    [title, amount, date, activeCategories, categoryId, entryType, onSuccess]
  );

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
      <div>
        <p className={labelClass}>Tipo</p>
        <div className="mt-1.5 grid grid-cols-2 gap-2 rounded-xl bg-[var(--muted)]/40 p-1">
          <button
            type="button"
            onClick={() => handleTypeChange("EXPENSE")}
            className={`rounded-lg py-2 text-sm font-medium transition ${
              entryType === "EXPENSE"
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Despesa
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("INCOME")}
            className={`rounded-lg py-2 text-sm font-medium transition ${
              entryType === "INCOME"
                ? "bg-[var(--card)] text-emerald-300 shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Receita
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="expense-title" className={labelClass}>
          Título
        </label>
        <input
          id="expense-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={entryType === "INCOME" ? "Ex: Salário" : "Ex: Supermercado"}
          className={inputClass}
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="expense-amount" className={labelClass}>
          Valor
        </label>
        <input
          id="expense-amount"
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d,.]/g, ""))}
          placeholder="Ex: 150,00"
          className={inputClass}
        />
      </div>

      <EntryCategorySelect
        categories={activeCategories}
        value={categoryId}
        onChange={setCategoryId}
        onAddCategory={entryType === "EXPENSE" ? onAddCategory : undefined}
      />

      <div>
        <label htmlFor="expense-date" className={labelClass}>
          Data
        </label>
        <input
          id="expense-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
        />
      </div>

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

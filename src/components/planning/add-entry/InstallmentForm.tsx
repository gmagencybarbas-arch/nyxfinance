"use client";

import { useState, useCallback } from "react";
import type { ExpenseCategory } from "@/components/profile/types";
import { categoryIdToName } from "@/lib/planning/profileStorage";
import { createInstallmentPlan } from "@/lib/planning/addEntryClients";
import { EntryCategorySelect } from "./EntryCategorySelect";
import {
  clampInt,
  dateInputToIso,
  inputClass,
  labelClass,
  parseBRLAmount,
  todayDateInputValue,
} from "./formShared";

interface InstallmentFormProps {
  categories: ExpenseCategory[];
  onAddCategory: (category: Omit<ExpenseCategory, "id">) => ExpenseCategory;
  onSuccess: () => void;
  onCancel: () => void;
}

export function InstallmentForm({
  categories,
  onAddCategory,
  onSuccess,
  onCancel,
}: InstallmentFormProps) {
  const [title, setTitle] = useState("");
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [totalInstallments, setTotalInstallments] = useState("2");
  const [firstDueDate, setFirstDueDate] = useState(todayDateInputValue);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "outros");
  const [trackInCommitments, setTrackInCommitments] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = title.trim();
      const parsedAmount = parseBRLAmount(installmentAmount);
      const count = clampInt(totalInstallments, 2, 360, 2);

      if (!trimmed) {
        setError("Informe um título.");
        return;
      }
      if (parsedAmount == null) {
        setError("Informe o valor da parcela.");
        return;
      }
      if (!firstDueDate) {
        setError("Informe o primeiro vencimento.");
        return;
      }

      setSaving(true);
      setError(null);
      try {
        await createInstallmentPlan({
          category: categoryIdToName(categories, categoryId),
          description: trimmed,
          totalInstallments: count,
          installmentAmount: parsedAmount,
          firstDueDate: dateInputToIso(firstDueDate),
          trackInCommitments,
        });
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar");
      } finally {
        setSaving(false);
      }
    },
    [
      title,
      installmentAmount,
      totalInstallments,
      firstDueDate,
      categories,
      categoryId,
      trackInCommitments,
      onSuccess,
    ]
  );

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
      <div>
        <label htmlFor="inst-title" className={labelClass}>
          Título
        </label>
        <input
          id="inst-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Notebook"
          className={inputClass}
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="inst-amount" className={labelClass}>
            Valor da parcela
          </label>
          <input
            id="inst-amount"
            type="text"
            inputMode="decimal"
            value={installmentAmount}
            onChange={(e) =>
              setInstallmentAmount(e.target.value.replace(/[^\d,.]/g, ""))
            }
            placeholder="Ex: 250,00"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="inst-count" className={labelClass}>
            Parcelas
          </label>
          <input
            id="inst-count"
            type="number"
            min={2}
            max={360}
            value={totalInstallments}
            onChange={(e) => setTotalInstallments(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="inst-first-due" className={labelClass}>
          Primeiro vencimento
        </label>
        <input
          id="inst-first-due"
          type="date"
          value={firstDueDate}
          onChange={(e) => setFirstDueDate(e.target.value)}
          className={inputClass}
        />
      </div>

      <EntryCategorySelect
        categories={categories}
        value={categoryId}
        onChange={setCategoryId}
        onAddCategory={onAddCategory}
      />

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 px-3.5 py-3">
        <input
          type="checkbox"
          checked={trackInCommitments}
          onChange={(e) => setTrackInCommitments(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-[var(--border)] accent-[var(--nyx-gradient-start)]"
        />
        <span className="text-sm text-[var(--foreground)]">
          Acompanhar no planejamento
          <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
            Inclui as parcelas no comprometimento mensal
          </span>
        </span>
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

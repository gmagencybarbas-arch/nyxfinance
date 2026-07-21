"use client";

import { useState } from "react";
import type { NyxAction } from "@/lib/nyx/types";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "@/components/profile/constants/categories";

const CATEGORIES = [
  ...DEFAULT_EXPENSE_CATEGORIES.map((c) => c.name),
  ...DEFAULT_INCOME_CATEGORIES.map((c) => c.name),
];

interface NyxActionEditFormProps {
  action: NyxAction;
  onSave: (action: NyxAction) => void;
  onCancel: () => void;
}

function toDateInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fromDateInput(value: string, fallbackIso: string): string {
  if (!value) return fallbackIso;
  return `${value}T12:00:00`;
}

export function NyxActionEditForm({ action, onSave, onCancel }: NyxActionEditFormProps) {
  const [draft, setDraft] = useState<NyxAction>(action);

  const fieldClass =
    "w-full rounded-lg border border-white/[0.1] bg-[var(--input)] px-2.5 py-2 text-sm text-[var(--foreground)]";

  return (
    <div className="space-y-2">
      {draft.transaction && (
        <>
          <input
            className={fieldClass}
            value={draft.transaction.description}
            onChange={(e) =>
              setDraft({
                ...draft,
                transaction: { ...draft.transaction!, description: e.target.value },
              })
            }
            placeholder="Descrição"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0.01}
              step="0.01"
              className={fieldClass}
              value={draft.transaction.amount}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  transaction: {
                    ...draft.transaction!,
                    amount: Number(e.target.value) || 0,
                  },
                })
              }
            />
            <select
              className={fieldClass}
              value={draft.transaction.type}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  transaction: {
                    ...draft.transaction!,
                    type: e.target.value as "INCOME" | "EXPENSE" | "TRANSFER",
                  },
                })
              }
            >
              <option value="EXPENSE">Despesa</option>
              <option value="INCOME">Receita</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              className={fieldClass}
              value={draft.transaction.category}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  transaction: { ...draft.transaction!, category: e.target.value },
                })
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="date"
              className={fieldClass}
              value={toDateInput(draft.transaction.occurredAt)}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  transaction: {
                    ...draft.transaction!,
                    occurredAt: fromDateInput(e.target.value, draft.transaction!.occurredAt),
                  },
                })
              }
            />
          </div>
          <select
            className={fieldClass}
            value={draft.transaction.planningType}
            onChange={(e) =>
              setDraft({
                ...draft,
                transaction: {
                  ...draft.transaction!,
                  planningType: e.target.value as "ACTUAL" | "PLANNED" | "COMMITTED",
                },
              })
            }
          >
            <option value="ACTUAL">Realizado</option>
            <option value="PLANNED">Previsto</option>
            <option value="COMMITTED">Comprometido</option>
          </select>
        </>
      )}

      {draft.installment && (
        <>
          <input
            className={fieldClass}
            value={draft.installment.description}
            onChange={(e) =>
              setDraft({
                ...draft,
                installment: { ...draft.installment!, description: e.target.value },
              })
            }
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0.01}
              step="0.01"
              className={fieldClass}
              value={draft.installment.installmentAmount}
              onChange={(e) => {
                const installmentAmount = Number(e.target.value) || 0;
                const totalInstallments = draft.installment!.totalInstallments;
                setDraft({
                  ...draft,
                  installment: {
                    ...draft.installment!,
                    installmentAmount,
                    totalAmount: Number((installmentAmount * totalInstallments).toFixed(2)),
                  },
                });
              }}
            />
            <input
              type="number"
              min={2}
              className={fieldClass}
              value={draft.installment.totalInstallments}
              onChange={(e) => {
                const totalInstallments = Math.max(2, Number(e.target.value) || 2);
                const installmentAmount = draft.installment!.installmentAmount;
                setDraft({
                  ...draft,
                  installment: {
                    ...draft.installment!,
                    totalInstallments,
                    totalAmount: Number((installmentAmount * totalInstallments).toFixed(2)),
                  },
                });
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              className={fieldClass}
              value={draft.installment.category}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  installment: { ...draft.installment!, category: e.target.value },
                })
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="date"
              className={fieldClass}
              value={toDateInput(draft.installment.firstDueDate)}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  installment: {
                    ...draft.installment!,
                    firstDueDate: fromDateInput(e.target.value, draft.installment!.firstDueDate),
                  },
                })
              }
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <input
              type="checkbox"
              checked={draft.installment.trackInCommitments}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  installment: {
                    ...draft.installment!,
                    trackInCommitments: e.target.checked,
                  },
                })
              }
            />
            Acompanhar nos compromissos
          </label>
        </>
      )}

      {draft.recurringBill && (
        <>
          <input
            className={fieldClass}
            value={draft.recurringBill.title}
            onChange={(e) =>
              setDraft({
                ...draft,
                recurringBill: { ...draft.recurringBill!, title: e.target.value },
              })
            }
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0.01}
              step="0.01"
              className={fieldClass}
              value={draft.recurringBill.amount}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  recurringBill: {
                    ...draft.recurringBill!,
                    amount: Number(e.target.value) || 0,
                  },
                })
              }
            />
            <input
              type="number"
              min={1}
              max={31}
              className={fieldClass}
              value={draft.recurringBill.dueDay}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  recurringBill: {
                    ...draft.recurringBill!,
                    dueDay: Math.min(31, Math.max(1, Number(e.target.value) || 1)),
                  },
                })
              }
            />
          </div>
          <select
            className={fieldClass}
            value={draft.recurringBill.category}
            onChange={(e) =>
              setDraft({
                ...draft,
                recurringBill: { ...draft.recurringBill!, category: e.target.value },
              })
            }
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-white/[0.1] py-2.5 text-xs font-medium text-[var(--muted-foreground)]"
        >
          Cancelar edição
        </button>
        <button
          type="button"
          onClick={() => onSave(draft)}
          className="flex-1 rounded-xl bg-violet-500/90 py-2.5 text-xs font-semibold text-white"
        >
          Aplicar alterações
        </button>
      </div>
    </div>
  );
}

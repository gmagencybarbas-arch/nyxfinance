"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  Calendar,
  Tag,
  Layers,
  Repeat,
  CreditCard,
  MessageCircle,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { NyxAction, NyxPendingBatch } from "@/lib/nyx/types";
import { NyxActionEditForm } from "./NyxActionEditForm";

function formatBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (sameDay) return "Hoje";
  return d.toLocaleDateString("pt-BR");
}

function planningLabel(t: string) {
  if (t === "ACTUAL") return "Realizado";
  if (t === "PLANNED") return "Previsto";
  if (t === "COMMITTED") return "Comprometido";
  return t;
}

type DetailRow = { icon: typeof Tag; label: string; value: string };

function getActionView(a: NyxAction): {
  title: string;
  amount: number | null;
  amountLabel: string;
  chip: string;
  chipTone: "expense" | "income" | "plan";
  details: DetailRow[];
} {
  if (a.transaction) {
    const isIncome = a.transaction.type === "INCOME";
    return {
      title: a.transaction.description,
      amount: a.transaction.amount,
      amountLabel: formatBRL(a.transaction.amount),
      chip: isIncome ? "Receita" : "Despesa",
      chipTone: isIncome ? "income" : "expense",
      details: [
        { icon: Tag, label: "Categoria", value: a.transaction.category },
        { icon: Calendar, label: "Data", value: formatDate(a.transaction.occurredAt) },
        {
          icon: Layers,
          label: "Tipo",
          value: planningLabel(a.transaction.planningType),
        },
      ].filter((d) => Boolean(d.value)),
    };
  }
  if (a.installment) {
    return {
      title: a.installment.description,
      amount: a.installment.installmentAmount,
      amountLabel: `${a.installment.totalInstallments}x de ${formatBRL(a.installment.installmentAmount)}`,
      chip: "Parcelamento",
      chipTone: "plan",
      details: [
        { icon: Tag, label: "Categoria", value: a.installment.category },
        {
          icon: Calendar,
          label: "1ª parcela",
          value: formatDate(a.installment.firstDueDate),
        },
        {
          icon: CreditCard,
          label: "Parcelas",
          value: `${a.installment.totalInstallments}x · total ${formatBRL(a.installment.totalAmount)}`,
        },
        a.installment.trackInCommitments
          ? { icon: Repeat, label: "Acompanhamento", value: "Nos compromissos" }
          : null,
      ].filter(Boolean) as DetailRow[],
    };
  }
  if (a.recurringBill) {
    return {
      title: a.recurringBill.title,
      amount: a.recurringBill.amount,
      amountLabel: formatBRL(a.recurringBill.amount),
      chip: "Conta fixa",
      chipTone: "plan",
      details: [
        { icon: Tag, label: "Categoria", value: a.recurringBill.category },
        {
          icon: Repeat,
          label: "Recorrência",
          value: `Todo dia ${a.recurringBill.dueDay}`,
        },
      ],
    };
  }
  return {
    title: "Lançamento",
    amount: null,
    amountLabel: "—",
    chip: "Pendente",
    chipTone: "plan",
    details: [],
  };
}

export type NyxSavedFlash = {
  actionId: string;
  title: string;
  amountLabel: string;
};

interface NyxActionReviewProps {
  batch: NyxPendingBatch | null;
  failedIds?: Record<string, string>;
  persisting?: boolean;
  persistingIds?: string[];
  savedFlash?: NyxSavedFlash[];
  onChangeBatch: (batch: NyxPendingBatch | null) => void;
  onConfirmAll: () => void;
  onCancelAll: () => void;
  onConfirmOne: (actionId: string) => void;
  onCorrectWithNyx?: () => void;
}

function chipClass(tone: "expense" | "income" | "plan") {
  if (tone === "income") return "bg-emerald-500/15 text-emerald-300";
  if (tone === "expense") return "bg-rose-500/12 text-rose-300";
  return "bg-violet-500/12 text-violet-300";
}

export function NyxActionReview({
  batch,
  failedIds = {},
  persisting,
  persistingIds = [],
  savedFlash = [],
  onChangeBatch,
  onConfirmAll,
  onCancelAll,
  onConfirmOne,
  onCorrectWithNyx,
}: NyxActionReviewProps) {
  const reduced = useReducedMotion() ?? false;
  const [editingId, setEditingId] = useState<string | null>(null);
  const actions = batch?.actions ?? [];
  const count = actions.length;
  const allValid = actions.every((a) => (a.missingFields?.length ?? 0) === 0);

  const header = useMemo(() => {
    if (count === 0) return null;
    if (count === 1) return "Confirma esse lançamento?";
    return `Encontrei ${count} lançamentos`;
  }, [count]);

  if (count === 0 && savedFlash.length === 0) return null;

  const removeAction = (actionId: string) => {
    if (!batch) return;
    const next = batch.actions.filter((a) => a.actionId !== actionId);
    onChangeBatch(next.length ? { ...batch, actions: next } : null);
  };

  const updateAction = (updated: NyxAction) => {
    if (!batch) return;
    onChangeBatch({
      ...batch,
      actions: batch.actions.map((a) => (a.actionId === updated.actionId ? updated : a)),
    });
    setEditingId(null);
  };

  return (
    <div className="mx-auto w-full max-w-[520px] space-y-3 px-3 pb-2 md:px-4">
      {header && (
        <div className="flex items-start gap-2.5 px-0.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--foreground)]">{header}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Dá uma olhada antes que eu salve isso.
            </p>
          </div>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {savedFlash.map((flash) => (
          <motion.div
            key={`saved-${flash.actionId}`}
            layout
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3.5"
          >
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-emerald-300">Lançamento salvo</p>
                <p className="mt-0.5 truncate text-sm text-[var(--foreground)]">
                  {flash.title}
                </p>
                <p className="text-base font-semibold tabular-nums text-[var(--foreground)]">
                  {flash.amountLabel}
                </p>
                <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
                  Pronto. Agora não finge que esse gasto não aconteceu.
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {actions.map((action) => {
          const failed = failedIds[action.actionId];
          const editing = editingId === action.actionId;
          const busy =
            Boolean(persisting) &&
            (persistingIds.length === 0 || persistingIds.includes(action.actionId));
          const view = getActionView(action);

          return (
            <motion.article
              key={action.actionId}
              layout
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={`rounded-2xl border px-4 py-4 ${
                failed
                  ? "border-amber-500/35 bg-amber-500/[0.06]"
                  : "border-white/[0.08] bg-[var(--card)]/90"
              }`}
            >
              {editing ? (
                <NyxActionEditForm
                  action={action}
                  onCancel={() => setEditingId(null)}
                  onSave={updateAction}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-[var(--foreground)]">
                        {view.title}
                      </p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-[var(--foreground)]">
                        {view.amountLabel}
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${chipClass(view.chipTone)}`}
                      >
                        {view.chip}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeAction(action.actionId)}
                      className="rounded-lg p-2 text-[var(--muted-foreground)] transition hover:bg-white/[0.04] hover:text-rose-300 disabled:opacity-40"
                      aria-label="Descartar lançamento"
                      title="Descartar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {view.details.length > 0 && (
                    <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                      {view.details.map((d) => {
                        const Icon = d.icon;
                        return (
                          <div key={d.label} className="flex min-w-0 items-center gap-2.5">
                            <Icon
                              className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]"
                              aria-hidden
                            />
                            <dt className="w-[4.5rem] shrink-0 text-[11px] text-[var(--muted-foreground)]">
                              {d.label}
                            </dt>
                            <dd className="truncate text-[13px] text-[var(--foreground)]">
                              {d.value}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  )}

                  {failed && (
                    <p
                      className="mt-3 flex items-start gap-1.5 text-xs text-amber-300"
                      role="alert"
                    >
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {failed}
                    </p>
                  )}

                  <div className="mt-4 space-y-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setEditingId(action.actionId)}
                      className="text-left text-[12px] font-medium text-violet-300/90 underline-offset-2 hover:underline disabled:opacity-40"
                    >
                      Editar informações
                    </button>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onCorrectWithNyx?.()}
                        className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/[0.1] px-3 text-[13px] font-medium text-[var(--muted-foreground)] transition hover:bg-white/[0.03] disabled:opacity-40"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Corrigir com a Nyx
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onConfirmOne(action.actionId)}
                        className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500/90 px-3 text-[13px] font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                      >
                        {busy ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Salvando…
                          </>
                        ) : failed ? (
                          "Tentar novamente"
                        ) : (
                          "Confirmar lançamento"
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.article>
          );
        })}
      </AnimatePresence>

      {count > 1 && (
        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <button
            type="button"
            disabled={persisting}
            onClick={onCancelAll}
            className="min-h-11 flex-1 rounded-xl border border-white/[0.1] text-[13px] font-medium text-[var(--muted-foreground)] disabled:opacity-40"
          >
            Descartar todos
          </button>
          <button
            type="button"
            disabled={persisting || !allValid}
            onClick={onConfirmAll}
            className="min-h-11 flex-1 rounded-xl bg-emerald-500/90 text-[13px] font-semibold text-white disabled:opacity-50"
          >
            {persisting ? "Salvando…" : "Confirmar todos"}
          </button>
        </div>
      )}

      {count === 1 && (
        <div className="flex justify-center">
          <button
            type="button"
            disabled={persisting}
            onClick={onCancelAll}
            className="text-[12px] text-[var(--muted-foreground)] underline-offset-2 hover:underline disabled:opacity-40"
          >
            Descartar
          </button>
        </div>
      )}
    </div>
  );
}

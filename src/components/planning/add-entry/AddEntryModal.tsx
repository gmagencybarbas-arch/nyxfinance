"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, Receipt, CreditCard, RefreshCw } from "lucide-react";
import type { ExpenseCategory } from "@/components/profile/types";
import {
  loadExpenseCategories,
  loadIncomeCategories,
  persistCustomCategory,
} from "@/lib/planning/profileStorage";
import { ExpenseForm } from "./ExpenseForm";
import { InstallmentForm } from "./InstallmentForm";
import { RecurringBillForm } from "./RecurringBillForm";

export type AddEntryKind = "expense" | "installment" | "recurring";

interface AddEntryModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Abre direto num tipo, sem tela de escolha. */
  initialKind?: AddEntryKind;
}

const ENTRY_OPTIONS: {
  kind: AddEntryKind;
  emoji: string;
  title: string;
  subtitle: string;
  icon: typeof Receipt;
}[] = [
  {
    kind: "expense",
    emoji: "📄",
    title: "Lançamento único",
    subtitle: "Despesa ou receita avulsa",
    icon: Receipt,
  },
  {
    kind: "installment",
    emoji: "💳",
    title: "Parcelamento",
    subtitle: "Divide em parcelas futuras",
    icon: CreditCard,
  },
  {
    kind: "recurring",
    emoji: "🔁",
    title: "Conta mensal",
    subtitle: "Recorrente todo mês",
    icon: RefreshCw,
  },
];

export function AddEntryModal({ open, onClose, onSaved, initialKind }: AddEntryModalProps) {
  const [step, setStep] = useState<"pick" | AddEntryKind>("pick");
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [incomeCategories] = useState<ExpenseCategory[]>(() => loadIncomeCategories());

  useEffect(() => {
    if (open) {
      setCategories(loadExpenseCategories());
      setStep(initialKind ?? "pick");
    }
  }, [open, initialKind]);

  const handleAddCategory = useCallback((category: Omit<ExpenseCategory, "id">) => {
    const added = persistCustomCategory(category);
    setCategories((prev) => {
      if (prev.some((c) => c.id === added.id)) return prev;
      return [...prev, added];
    });
    return added;
  }, []);

  const handleClose = useCallback(() => {
    setStep("pick");
    onClose();
  }, [onClose]);

  const handleSaved = useCallback(() => {
      onSaved();
      handleClose();
    },
    [onSaved, handleClose]
  );

  const title =
    step === "pick"
      ? "O que deseja adicionar?"
      : step === "expense"
        ? "Lançamento único"
        : step === "installment"
          ? "Parcelamento"
          : "Conta mensal";

  const modal = (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Fechar"
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-entry-title"
            className="fixed inset-x-0 bottom-0 z-[101] flex max-h-[92dvh] flex-col overflow-hidden rounded-t-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[min(88dvh,720px)] sm:w-[calc(100%-2rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--nyx-gradient-start)]/10 via-transparent to-[var(--nyx-gradient-end)]/5"
              aria-hidden
            />
            <div className="relative mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[var(--border)] sm:hidden" />

            <div className="relative flex shrink-0 items-center gap-2 border-b border-[var(--border)] px-4 py-4 sm:px-5">
              {step !== "pick" && (
                <button
                  type="button"
                  onClick={() => setStep("pick")}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                  aria-label="Voltar"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <h2
                id="add-entry-title"
                className="flex-1 text-lg font-semibold text-[var(--foreground)]"
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
              {step === "pick" ? (
                <div className="grid gap-3">
                  {ENTRY_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <motion.button
                        key={opt.kind}
                        type="button"
                        onClick={() => setStep(opt.kind)}
                        className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/20 p-4 text-left transition hover:border-[var(--nyx-gradient-start)]/40 hover:bg-[var(--muted)]/40"
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--nyx-gradient-start)]/20 to-[var(--nyx-gradient-end)]/10 text-xl">
                          <span aria-hidden>{opt.emoji}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[var(--foreground)]">{opt.title}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{opt.subtitle}</p>
                        </div>
                        <Icon className="h-5 w-5 shrink-0 text-[var(--muted-foreground)] opacity-0 transition group-hover:opacity-100" />
                      </motion.button>
                    );
                  })}
                </div>
              ) : step === "expense" ? (
                <ExpenseForm
                  categories={categories}
                  incomeCategories={incomeCategories}
                  onAddCategory={handleAddCategory}
                  onSuccess={handleSaved}
                  onCancel={() => setStep("pick")}
                />
              ) : step === "installment" ? (
                <InstallmentForm
                  categories={categories}
                  onAddCategory={handleAddCategory}
                  onSuccess={handleSaved}
                  onCancel={() => setStep("pick")}
                />
              ) : (
                <RecurringBillForm
                  categories={categories}
                  onAddCategory={handleAddCategory}
                  onSuccess={handleSaved}
                  onCancel={() => setStep("pick")}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}

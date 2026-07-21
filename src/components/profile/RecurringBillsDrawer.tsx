"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { RecurringExpensesSection } from "./RecurringExpensesSection";
import type { ExpenseCategory, RecurringExpense } from "./types";

interface RecurringBillsDrawerProps {
  open: boolean;
  onClose: () => void;
  items: RecurringExpense[];
  categories: ExpenseCategory[];
  loading?: boolean;
  error?: string | null;
  onAdd: (item: Omit<RecurringExpense, "id">) => void;
  onUpdate: (id: string, item: Omit<RecurringExpense, "id">) => void;
  onRemove: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
  onAddCategory: (category: Omit<ExpenseCategory, "id">) => ExpenseCategory;
}

export function RecurringBillsDrawer({
  open,
  onClose,
  items,
  categories,
  loading,
  error,
  onAdd,
  onUpdate,
  onRemove,
  onToggleActive,
  onAddCategory,
}: RecurringBillsDrawerProps) {
  const reduced = useReducedMotion() ?? false;
  const [mounted, setMounted] = useState(false);
  const [editingForm, setEditingForm] = useState(false);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setEditingForm(false);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => closeRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open]);

  const requestClose = useCallback(() => {
    if (editingForm) return;
    onClose();
  }, [editingForm, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, requestClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Fechar painel"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            onClick={requestClose}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal
            aria-labelledby={titleId}
            className="relative z-10 flex h-[min(92dvh,100%)] w-full flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[var(--card)] shadow-2xl max-md:mt-auto md:h-full md:max-w-[460px] md:rounded-none md:border-l md:border-t-0 md:border-r-0 md:border-b-0"
            initial={
              reduced
                ? false
                : {
                    x: typeof window !== "undefined" && window.innerWidth >= 768 ? 40 : 0,
                    y: typeof window !== "undefined" && window.innerWidth < 768 ? 48 : 0,
                    opacity: 0.96,
                  }
            }
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={
              reduced
                ? { opacity: 0 }
                : {
                    x: typeof window !== "undefined" && window.innerWidth >= 768 ? 32 : 0,
                    y: typeof window !== "undefined" && window.innerWidth < 768 ? 40 : 0,
                    opacity: 0,
                  }
            }
            transition={{ duration: 0.22 }}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className="text-base font-semibold text-[var(--foreground)]"
                >
                  Despesas recorrentes
                </h2>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                  Tudo que volta para cobrar sua paz todo mês.
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={requestClose}
                disabled={editingForm}
                className="rounded-lg p-2 text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] disabled:opacity-40"
                aria-label="Fechar"
                title={
                  editingForm
                    ? "Conclua ou cancele a edição antes de fechar"
                    : "Fechar"
                }
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
              {loading && items.length === 0 ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-xl bg-[var(--muted)]/40"
                    />
                  ))}
                </div>
              ) : (
                <RecurringExpensesSection
                  items={items}
                  categories={categories}
                  onAdd={onAdd}
                  onUpdate={onUpdate}
                  onRemove={onRemove}
                  onToggleActive={onToggleActive}
                  onAddCategory={onAddCategory}
                  hideMobileFab
                  variant="panel"
                  onCreateModeChange={setEditingForm}
                />
              )}
              {error && (
                <p className="mt-3 text-sm text-rose-400" role="alert">
                  {error}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

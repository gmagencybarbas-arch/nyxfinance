"use client";

import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Calendar,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "./utils/profile";
import { AddCategoryModal } from "./AddCategoryModal";
import type { RecurringExpense, ExpenseCategory } from "./types";

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Próxima data de cobrança a partir do dia do mês (1–31). */
export function nextChargeDate(dueDay: number, from = new Date()): Date {
  const y = from.getFullYear();
  const m = from.getMonth();
  const day = Math.max(1, Math.min(31, dueDay));
  const thisMonthDay = Math.min(day, daysInMonth(y, m));
  const candidate = new Date(y, m, thisMonthDay);
  const start = new Date(y, m, from.getDate());
  if (candidate >= start) return candidate;
  const nm = m + 1;
  const nextDay = Math.min(day, daysInMonth(y, nm));
  return new Date(y, nm, nextDay);
}

function formatNextCharge(dueDay: number) {
  return nextChargeDate(dueDay).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

type FormState = {
  name: string;
  amount: string;
  dueDay: string;
  categoryId: string;
  active: boolean;
};

const emptyForm = (categories: ExpenseCategory[]): FormState => ({
  name: "",
  amount: "",
  dueDay: "10",
  categoryId: categories[0]?.id ?? "",
  active: true,
});

interface RecurringExpensesSectionProps {
  items: RecurringExpense[];
  categories: ExpenseCategory[];
  onAdd: (item: Omit<RecurringExpense, "id">) => void;
  onRemove: (id: string) => void;
  onAddCategory: (category: Omit<ExpenseCategory, "id">) => ExpenseCategory;
  /** Atualiza um item existente (edição). */
  onUpdate?: (id: string, item: Omit<RecurringExpense, "id">) => void;
  /** Alterna ativo/pausado. */
  onToggleActive?: (id: string, active: boolean) => void;
  /** Esconde o FAB fixo (ex.: dentro de modal/drawer). */
  hideMobileFab?: boolean;
  /**
   * `page` — seção completa com título (legado / planejamento).
   * `panel` — conteúdo interno do drawer (sem título duplicado).
   */
  variant?: "page" | "panel";
  /** Abre o formulário de criação ao montar (ex.: botão “Adicionar primeira”). */
  startInCreate?: boolean;
  onCreateModeChange?: (open: boolean) => void;
}

function RecurringExpensesSectionBase({
  items,
  categories,
  onAdd,
  onRemove,
  onAddCategory,
  onUpdate,
  onToggleActive,
  hideMobileFab = false,
  variant = "page",
  startInCreate = false,
  onCreateModeChange,
}: RecurringExpensesSectionProps) {
  const reduced = useReducedMotion() ?? false;
  const [mode, setMode] = useState<"list" | "create" | "edit">(
    startInCreate ? "create" : "list"
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(categories));
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const formTitleId = useId();

  useEffect(() => {
    if (startInCreate) {
      setMode("create");
      setForm(emptyForm(categories));
    }
  }, [startInCreate, categories]);

  useEffect(() => {
    onCreateModeChange?.(mode !== "list");
  }, [mode, onCreateModeChange]);

  useEffect(() => {
    if (!menuOpenId) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpenId(null);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpenId]);

  const openCreate = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm(categories));
    setMode("create");
    setMenuOpenId(null);
  }, [categories]);

  const openEdit = useCallback(
    (item: RecurringExpense) => {
      setEditingId(item.id);
      setForm({
        name: item.name,
        amount: (item.amount / 100).toFixed(2).replace(".", ","),
        dueDay: String(item.dueDay),
        categoryId: item.categoryId || categories[0]?.id || "",
        active: item.active !== false,
      });
      setMode("edit");
      setMenuOpenId(null);
    },
    [categories]
  );

  const handleCancel = useCallback(() => {
    setMode("list");
    setEditingId(null);
    setForm(emptyForm(categories));
  }, [categories]);

  const submitForm = useCallback(() => {
    const name = form.name.trim();
    const parsed = parseFloat(form.amount.replace(",", ".")) || 0;
    const amount = Math.round(parsed * 100);
    const dueDay = Math.max(1, Math.min(31, parseInt(form.dueDay, 10) || 10));
    const categoryId = form.categoryId || categories[0]?.id;
    if (!name || amount <= 0 || !categoryId) return;
    const payload: Omit<RecurringExpense, "id"> = {
      name,
      amount,
      dueDay,
      categoryId,
      active: form.active,
    };
    if (mode === "edit" && editingId && onUpdate) {
      onUpdate(editingId, payload);
    } else {
      onAdd(payload);
    }
    setMode("list");
    setEditingId(null);
    setForm(emptyForm(categories));
  }, [form, categories, mode, editingId, onAdd, onUpdate]);

  const handleCategorySelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value;
      if (v === "__add__") {
        setShowAddCategory(true);
        setForm((f) => ({ ...f, categoryId: categories[0]?.id ?? "" }));
      } else {
        setForm((f) => ({ ...f, categoryId: v }));
      }
    },
    [categories]
  );

  const handleSaveNewCategory = useCallback(
    (category: Omit<ExpenseCategory, "id">) => {
      const added = onAddCategory(category);
      setForm((f) => ({ ...f, categoryId: added.id }));
      setShowAddCategory(false);
    },
    [onAddCategory]
  );

  const summary = useMemo(() => {
    const active = items.filter((i) => i.active !== false);
    const total = active.reduce((s, i) => s + i.amount, 0);
    let nearest: { name: string; date: Date } | null = null;
    for (const i of active) {
      const d = nextChargeDate(i.dueDay);
      if (!nearest || d < nearest.date) nearest = { name: i.name, date: d };
    }
    return {
      activeCount: active.length,
      total,
      nextLabel: nearest
        ? `${nearest.name} · ${nearest.date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          })}`
        : null,
    };
  }, [items]);

  const showForm = mode === "create" || mode === "edit";
  const isPanel = variant === "panel";

  return (
    <motion.div
      className="space-y-4"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {!isPanel && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Despesas recorrentes
          </h3>
          {!hideMobileFab && (
            <motion.button
              type="button"
              onClick={openCreate}
              className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-mid)] text-white shadow-lg md:hidden"
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.05 }}
              aria-label="Adicionar despesa"
            >
              <Plus className="h-6 w-6" />
            </motion.button>
          )}
          <motion.button
            type="button"
            onClick={openCreate}
            className={`${
              hideMobileFab ? "flex" : "hidden md:flex"
            } items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--nyx-gradient-start)] transition-colors hover:bg-[var(--nyx-gradient-start)]/10`}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </motion.button>
        </div>
      )}

      {isPanel && !showForm && items.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
            <p className="text-[11px] text-[var(--muted-foreground)]">Ativas</p>
            <p className="text-sm font-semibold tabular-nums text-[var(--foreground)]">
              {summary.activeCount}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
            <p className="text-[11px] text-[var(--muted-foreground)]">Total / mês</p>
            <p className="text-sm font-semibold tabular-nums text-[var(--foreground)]">
              {formatCurrency(summary.total, 2)}
            </p>
          </div>
          {summary.nextLabel && (
            <div className="col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 sm:col-span-1">
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Próxima cobrança
              </p>
              <p className="truncate text-sm font-medium text-[var(--foreground)]">
                {summary.nextLabel}
              </p>
            </div>
          )}
        </div>
      )}

      {isPanel && !showForm && items.length > 0 && (
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--nyx-gradient-start)]/90 px-4 text-sm font-semibold text-white transition hover:bg-[var(--nyx-gradient-start)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Nova despesa recorrente
        </button>
      )}

      <AnimatePresence mode="wait">
        {items.length === 0 && !showForm && (
          <motion.div
            key="empty"
            className={
              isPanel
                ? "flex flex-col items-center px-2 py-10 text-center"
                : "dashboard-card dashboard-card-glow relative flex flex-col items-center justify-center overflow-hidden p-8 text-center"
            }
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--muted)]">
              <Wallet className="h-7 w-7 text-[var(--muted-foreground)]" />
            </div>
            <p className="mb-1 text-sm font-medium text-[var(--foreground)]">
              {isPanel
                ? "Nenhuma cobrança recorrente por enquanto"
                : "Nenhuma despesa fixa"}
            </p>
            <p className="mb-4 max-w-xs text-xs text-[var(--muted-foreground)]">
              {isPanel
                ? "Quando cadastrar uma conta fixa ou assinatura, ela aparece aqui."
                : "Adicione aluguel, assinaturas e outros gastos recorrentes"}
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="min-h-11 rounded-xl bg-[var(--nyx-gradient-start)]/20 px-4 py-2 text-sm font-medium text-[var(--nyx-gradient-start)] transition-colors hover:bg-[var(--nyx-gradient-start)]/30"
            >
              {isPanel ? "Adicionar primeira despesa" : "Adicionar despesa"}
            </button>
          </motion.div>
        )}

        {showForm && (
          <motion.div
            key="form"
            className={
              isPanel
                ? "rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
                : "dashboard-card dashboard-card-glow relative overflow-hidden p-4 sm:p-6"
            }
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
          >
            <h4
              id={formTitleId}
              className="mb-4 text-sm font-semibold text-[var(--foreground)]"
            >
              {mode === "edit" ? "Editar despesa recorrente" : "Nova despesa recorrente"}
            </h4>
            <div className="mb-4 space-y-3" role="group" aria-labelledby={formTitleId}>
              <div>
                <label htmlFor="rec-name" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                  Nome
                </label>
                <input
                  id="rec-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Aluguel, Netflix"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2.5 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="rec-amount" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                  Valor
                </label>
                <input
                  id="rec-amount"
                  type="text"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      amount: e.target.value.replace(/[^\d,.]/g, ""),
                    }))
                  }
                  placeholder="Ex: 1500 ou 89,90"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2.5 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="rec-category" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                  Categoria
                </label>
                <select
                  id="rec-category"
                  value={form.categoryId}
                  onChange={handleCategorySelectChange}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2.5 text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="__add__">Adicionar categoria…</option>
                </select>
              </div>
              <div>
                <label htmlFor="rec-due" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                  Dia da cobrança
                </label>
                <select
                  id="rec-due"
                  value={form.dueDay}
                  onChange={(e) => setForm((f) => ({ ...f, dueDay: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2.5 text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      Dia {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="rec-freq" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                  Frequência
                </label>
                <select
                  id="rec-freq"
                  value="monthly"
                  disabled
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2.5 text-[var(--muted-foreground)] opacity-80"
                >
                  <option value="monthly">Mensal</option>
                </select>
              </div>
              <div>
                <label htmlFor="rec-status" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                  Status
                </label>
                <select
                  id="rec-status"
                  value={form.active ? "active" : "paused"}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, active: e.target.value === "active" }))
                  }
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2.5 text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none"
                >
                  <option value="active">Ativa</option>
                  <option value="paused">Pausada</option>
                </select>
              </div>
            </div>
            <AddCategoryModal
              isOpen={showAddCategory}
              onClose={() => setShowAddCategory(false)}
              onSave={handleSaveNewCategory}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="min-h-11 flex-1 rounded-xl bg-[var(--muted)] text-sm font-medium text-[var(--foreground)] hover:bg-[var(--border)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitForm}
                className="min-h-11 flex-1 rounded-xl bg-[var(--nyx-gradient-start)] text-sm font-medium text-white hover:opacity-90"
              >
                {mode === "edit" ? "Salvar alterações" : "Salvar"}
              </button>
            </div>
          </motion.div>
        )}

        {items.length > 0 && !showForm && (
          <motion.div
            key="list"
            className="space-y-2"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {items.map((item, i) => {
              const catName =
                categories.find((c) => c.id === item.categoryId)?.name ?? "—";
              const isActive = item.active !== false;
              return (
                <motion.div
                  key={item.id}
                  className={
                    isPanel
                      ? "relative flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3"
                      : "dashboard-card relative flex items-center gap-3 overflow-hidden px-4 py-3"
                  }
                  initial={reduced ? false : { opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.2 }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--muted)]">
                    <Calendar className="h-5 w-5 text-[var(--muted-foreground)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">
                        {item.name}
                      </p>
                      <span
                        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                          isActive
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-white/10 text-[var(--muted-foreground)]"
                        }`}
                      >
                        {isActive ? "Ativa" : "Pausada"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      {catName} · Mensal · Dia {item.dueDay}
                      {isPanel && ` · Próx. ${formatNextCharge(item.dueDay)}`}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 text-sm font-semibold tabular-nums ${
                      isActive ? "text-rose-400" : "text-[var(--muted-foreground)]"
                    }`}
                  >
                    {formatCurrency(item.amount, 2)}
                  </p>

                  {onUpdate || onToggleActive ? (
                    <div className="relative shrink-0" ref={menuOpenId === item.id ? menuRef : undefined}>
                      <button
                        type="button"
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition hover:bg-white/[0.04] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                        aria-label={`Ações de ${item.name}`}
                        aria-haspopup="menu"
                        aria-expanded={menuOpenId === item.id}
                        onClick={() =>
                          setMenuOpenId((id) => (id === item.id ? null : item.id))
                        }
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      <AnimatePresence>
                        {menuOpenId === item.id && (
                          <motion.div
                            role="menu"
                            initial={reduced ? false : { opacity: 0, scale: 0.96, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-white/10 bg-[var(--card)] py-1 shadow-xl"
                          >
                            {onUpdate && (
                              <button
                                type="button"
                                role="menuitem"
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[var(--foreground)] hover:bg-white/[0.04]"
                                onClick={() => openEdit(item)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Editar
                              </button>
                            )}
                            {onToggleActive && (
                              <button
                                type="button"
                                role="menuitem"
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[var(--foreground)] hover:bg-white/[0.04]"
                                onClick={() => {
                                  onToggleActive(item.id, !isActive);
                                  setMenuOpenId(null);
                                }}
                              >
                                {isActive ? (
                                  <>
                                    <Pause className="h-3.5 w-3.5" />
                                    Pausar
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-3.5 w-3.5" />
                                    Reativar
                                  </>
                                )}
                              </button>
                            )}
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-rose-300 hover:bg-rose-500/10"
                              onClick={() => {
                                onRemove(item.id);
                                setMenuOpenId(null);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Excluir
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="rounded-lg p-2 text-[var(--muted-foreground)] transition-colors hover:bg-red-500/10 hover:text-red-400"
                      aria-label="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export const RecurringExpensesSection = memo(RecurringExpensesSectionBase);

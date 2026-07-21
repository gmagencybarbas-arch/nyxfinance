"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Settings, Trash2 } from "lucide-react";
import type { Transaction } from "./mockData";
import { deleteTransactionClient } from "@/lib/transactions/deleteTransactionClient";
import { updateTransactionClient } from "@/lib/transactions/updateTransactionClient";
import { planningStatusLabel } from "@/lib/planning/planningRowModal";
import type { PlanningRow } from "@/lib/planning/types";
import { useToast } from "@/contexts/ToastContext";
import { PaidCelebrationOverlay } from "@/components/feedback/PaidCelebrationOverlay";
import { playPaidCelebrationSound } from "@/lib/feedback/paidCelebration";
import {
  dateInputToIso,
  inputClass,
  labelClass,
  parseBRLAmount,
} from "@/components/planning/add-entry/formShared";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Math.abs(v));
}

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(d);
  } catch {
    return iso;
  }
}

function isoToDateInput(iso?: string): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function amountToInput(v: number): string {
  return Math.abs(v).toFixed(2).replace(".", ",");
}

function displayStatus(
  transaction: Transaction,
  planningRowStatus?: PlanningRow["status"]
): string {
  if (planningRowStatus) return planningStatusLabel(planningRowStatus);
  if (transaction.status === "COMPLETED") return "Pago";
  if (transaction.status === "PENDING") return "Pendente";
  if (transaction.status === "CANCELED") return "Cancelado";
  return transaction.status ?? "—";
}

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  canDelete?: boolean;
  canEdit?: boolean;
  deleteHint?: string;
  onDeleted?: () => void;
  canUpdateStatus?: boolean;
  planningRowStatus?: PlanningRow["status"];
  statusHint?: string;
  onUpdated?: () => void;
}

export function TransactionDetailModal({
  transaction,
  onClose,
  canDelete = true,
  canEdit = true,
  deleteHint,
  onDeleted,
  canUpdateStatus = false,
  planningRowStatus,
  statusHint,
  onUpdated,
}: TransactionDetailModalProps) {
  const toast = useToast();
  const open = transaction != null;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [celebratingPaid, setCelebratingPaid] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDate, setEditDate] = useState("");

  const isPaid =
    planningRowStatus === "paid" || transaction?.status === "COMPLETED";

  useEffect(() => {
    if (!open || !transaction) return;
    setConfirmDelete(false);
    setEditing(false);
    setDeleting(false);
    setDeleteError(null);
    setUpdatingStatus(false);
    setSavingEdit(false);
    setEditError(null);
    setCelebratingPaid(false);
    setEditDescription(transaction.description);
    setEditAmount(amountToInput(transaction.amount));
    setEditCategory(transaction.category);
    setEditDate(isoToDateInput(transaction.occurredAtIso ?? transaction.date));
  }, [open, transaction?.id, transaction]);

  async function handleDelete() {
    if (!transaction?.id || !canDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteTransactionClient(transaction.id);
      toast.show("Lançamento excluído.", "success");
      onDeleted?.();
      onClose();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Erro ao excluir");
    } finally {
      setDeleting(false);
    }
  }

  function finishAfterCelebration() {
    toast.show("Marcado como pago.", "success");
    onUpdated?.();
    onClose();
    setCelebratingPaid(false);
  }

  async function handleStatusToggle() {
    if (!transaction?.id || !canUpdateStatus || updatingStatus || celebratingPaid) return;
    const nextStatus = isPaid ? "PENDING" : "COMPLETED";
    setUpdatingStatus(true);
    try {
      await updateTransactionClient(transaction.id, { status: nextStatus });
      if (nextStatus === "COMPLETED") {
        playPaidCelebrationSound();
        setCelebratingPaid(true);
      } else {
        toast.show("Marcado como pendente.", "success");
        onUpdated?.();
        onClose();
      }
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Erro ao atualizar status", "error");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleSaveEdit() {
    if (!transaction?.id || savingEdit) return;
    const trimmed = editDescription.trim();
    const parsedAmount = parseBRLAmount(editAmount);
    const trimmedCategory = editCategory.trim();

    if (!trimmed) {
      setEditError("Informe um título.");
      return;
    }
    if (parsedAmount == null) {
      setEditError("Informe um valor válido.");
      return;
    }
    if (!trimmedCategory) {
      setEditError("Informe a categoria.");
      return;
    }
    if (!editDate) {
      setEditError("Informe a data.");
      return;
    }

    setSavingEdit(true);
    setEditError(null);
    try {
      await updateTransactionClient(transaction.id, {
        description: trimmed,
        amount: parsedAmount,
        category: trimmedCategory,
        occurredAt: dateInputToIso(editDate),
      });
      toast.show("Lançamento atualizado.", "success");
      onUpdated?.();
      onClose();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <>
      <PaidCelebrationOverlay show={celebratingPaid} onDone={finishAfterCelebration} />
      <AnimatePresence>
      {open && transaction && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="tx-detail-title"
            className="relative z-[101] w-full max-w-[400px] rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 id="tx-detail-title" className="text-lg font-semibold text-[var(--foreground)]">
                {editing ? "Editar lançamento" : "Detalhes do lançamento"}
              </h2>
              {canEdit && !confirmDelete && !editing && (
                <button
                  type="button"
                  aria-label="Editar lançamento"
                  onClick={() => setEditing(true)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  <Settings className="h-4 w-4" strokeWidth={1.75} />
                </button>
              )}
            </div>

            {editing ? (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSaveEdit();
                }}
              >
                <div>
                  <label htmlFor="edit-tx-title" className={labelClass}>
                    Título
                  </label>
                  <input
                    id="edit-tx-title"
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className={inputClass}
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="edit-tx-amount" className={labelClass}>
                    Valor
                  </label>
                  <input
                    id="edit-tx-amount"
                    type="text"
                    inputMode="decimal"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value.replace(/[^\d,.]/g, ""))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="edit-tx-category" className={labelClass}>
                    Categoria
                  </label>
                  <input
                    id="edit-tx-category"
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="edit-tx-date" className={labelClass}>
                    Data
                  </label>
                  <input
                    id="edit-tx-date"
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                {editError && (
                  <p className="text-sm text-red-400" role="alert">
                    {editError}
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={savingEdit}
                    onClick={() => {
                      setEditing(false);
                      setEditError(null);
                    }}
                    className="flex-1 rounded-xl bg-[var(--muted)] py-2.5 text-sm font-medium text-[var(--foreground)] hover:opacity-90 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
                  >
                    {savingEdit ? "Salvando…" : "Salvar"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-[var(--muted-foreground)]">Valor</dt>
                    <dd
                      className={`font-semibold ${
                        transaction.type === "income" ? "text-emerald-500" : "text-red-400"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted-foreground)]">Quando</dt>
                    <dd className="text-[var(--foreground)]">
                      {formatDateTime(transaction.occurredAtIso)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted-foreground)]">Título / descrição</dt>
                    <dd className="text-[var(--foreground)]">{transaction.description}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted-foreground)]">Categoria</dt>
                    <dd className="text-[var(--foreground)]">{transaction.category}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted-foreground)]">Tipo</dt>
                    <dd className="text-[var(--foreground)]">
                      {transaction.type === "income" ? "Receita" : "Despesa"}
                    </dd>
                  </div>
                  {(transaction.status || planningRowStatus) && (
                    <div>
                      <dt className="text-[var(--muted-foreground)]">Status</dt>
                      <dd className="text-[var(--foreground)]">
                        {displayStatus(transaction, planningRowStatus)}
                      </dd>
                      {statusHint && (
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{statusHint}</p>
                      )}
                    </div>
                  )}
                </dl>

                {confirmDelete ? (
                  <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                    <p className="text-sm font-medium text-[var(--foreground)]">Tem certeza?</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {deleteHint ??
                        "Este lançamento será removido permanentemente. Não dá para desfazer."}
                    </p>
                    {deleteError && (
                      <p className="mt-2 text-xs text-red-400" role="alert">
                        {deleteError}
                      </p>
                    )}
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 rounded-xl bg-[var(--muted)] py-2.5 text-sm font-medium text-[var(--foreground)] hover:opacity-90 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() => void handleDelete()}
                        className="flex-1 rounded-xl bg-red-500/90 py-2.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
                      >
                        {deleting ? "Excluindo…" : "Sim, excluir"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 space-y-2">
                    {canUpdateStatus && (
                      <button
                        type="button"
                        disabled={updatingStatus || celebratingPaid}
                        onClick={() => void handleStatusToggle()}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition disabled:opacity-50 ${
                          isPaid
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15"
                        }`}
                      >
                        {isPaid ? (
                          <>
                            <Circle className="h-4 w-4" />
                            {updatingStatus ? "Atualizando…" : "Marcar como pendente"}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            {updatingStatus ? "Atualizando…" : "Marcar como pago"}
                          </>
                        )}
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/15"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir lançamento
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full rounded-xl bg-[var(--muted)] py-2.5 text-sm font-medium text-[var(--foreground)] hover:opacity-90"
                    >
                      Fechar
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

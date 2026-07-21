"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { formatBRL } from "@/lib/planning/planningFormat";
import {
  isPlanningRowDeletable,
  isPlanningRowStatusUpdatable,
  planningDeleteHint,
  planningRowToTransaction,
} from "@/lib/planning/planningRowModal";
import type { PlanningRow, PlanningRowType } from "@/lib/planning/types";
import { TransactionDetailModal } from "@/components/transactions/TransactionDetailModal";
import type { Transaction } from "@/components/transactions/mockData";

const INITIAL_VISIBLE = 10;

const TYPE_LABELS: Record<PlanningRowType, string> = {
  recurring: "Recorrente",
  installment: "Parcela",
  manual: "Manual",
};

const STATUS_STYLES = {
  paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  scheduled: "bg-violet-500/15 text-violet-300 border-violet-500/20",
};

const STATUS_LABELS = {
  paid: "Pago",
  pending: "Pendente",
  scheduled: "Previsto",
};

interface PlanningGridProps {
  rows: PlanningRow[];
  onDeleted?: () => void;
}

export function PlanningGrid({ rows, onDeleted }: PlanningGridProps) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<{
    transaction: Transaction;
    row: PlanningRow;
  } | null>(null);

  const visibleRows = useMemo(() => {
    if (expanded || rows.length <= INITIAL_VISIBLE) return rows;
    return rows.slice(0, INITIAL_VISIBLE);
  }, [rows, expanded]);

  const hiddenCount = Math.max(0, rows.length - INITIAL_VISIBLE);

  if (rows.length === 0) {
    return (
      <div className="dashboard-card p-8 text-center text-sm text-[var(--muted-foreground)]">
        Nenhum compromisso neste mês. Use + Adicionar ou fale com a Nyx.
      </div>
    );
  }

  const openRow = (row: PlanningRow) => {
    setDetail({ transaction: planningRowToTransaction(row), row });
  };

  return (
    <>
      <motion.div
        className="dashboard-card overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="border-b border-[var(--border)] px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Compromissos do mês
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Toque numa linha para ver detalhes, marcar como pago ou excluir
            {!expanded && hiddenCount > 0
              ? ` · mostrando ${INITIAL_VISIBLE} de ${rows.length}`
              : ""}
          </p>
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                <th className="px-5 py-3">Categoria</th>
                <th className="px-3 py-3">Descrição</th>
                <th className="px-3 py-3 text-right">Valor</th>
                <th className="px-3 py-3">Vencimento</th>
                <th className="px-3 py-3">Tipo</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openRow(row)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openRow(row);
                    }
                  }}
                  className="cursor-pointer border-b border-[var(--border)]/60 transition hover:bg-[var(--muted)]/30"
                >
                  <td className="px-5 py-3.5 font-medium text-[var(--foreground)]">
                    {row.category}
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-3.5 text-[var(--foreground)]">
                    {row.description}
                    {row.progress && (
                      <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                        {row.progress.current}/{row.progress.total}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-right font-semibold tabular-nums text-[var(--foreground)]">
                    {formatBRL(row.amount)}
                  </td>
                  <td className="px-3 py-3.5 text-xs text-[var(--muted-foreground)]">
                    {row.dueLabel}
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="rounded-md bg-[var(--muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                      {TYPE_LABELS[row.type]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[row.status]}`}
                    >
                      {STATUS_LABELS[row.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2 p-2 sm:hidden">
          {visibleRows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => openRow(row)}
              className="dashboard-card w-full border border-transparent px-4 py-4 text-left transition hover:border-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-[var(--foreground)]">{row.description}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {row.category} · {row.dueLabel}
                  </p>
                </div>
                <p className="shrink-0 text-base font-semibold tabular-nums">
                  {formatBRL(row.amount)}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-md bg-[var(--muted)] px-2 py-0.5 text-[10px]">
                  {TYPE_LABELS[row.type]}
                </span>
                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] ${STATUS_STYLES[row.status]}`}
                >
                  {STATUS_LABELS[row.status]}
                </span>
              </div>
            </button>
          ))}
        </div>

        {hiddenCount > 0 && (
          <div className="border-t border-[var(--border)] px-4 py-3 sm:px-5">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-[var(--nyx-gradient-start)] transition hover:border-violet-400/30 hover:bg-violet-500/10"
            >
              {expanded
                ? "Ver menos"
                : `Ver mais (${hiddenCount} restante${hiddenCount === 1 ? "" : "s"})`}
            </button>
          </div>
        )}
      </motion.div>

      <TransactionDetailModal
        transaction={detail?.transaction ?? null}
        onClose={() => setDetail(null)}
        canDelete={detail ? isPlanningRowDeletable(detail.row) : false}
        canEdit={detail ? isPlanningRowDeletable(detail.row) : false}
        canUpdateStatus={detail ? isPlanningRowStatusUpdatable(detail.row) : false}
        planningRowStatus={detail?.row.status}
        statusHint={
          detail && !isPlanningRowStatusUpdatable(detail.row)
            ? "Contas recorrentes usam o interruptor ativo/pausado na seção acima."
            : undefined
        }
        deleteHint={
          detail
            ? isPlanningRowDeletable(detail.row)
              ? planningDeleteHint(detail.row)
              : "Contas recorrentes são geridas no perfil — pausa ou remove lá."
            : undefined
        }
        onDeleted={onDeleted}
        onUpdated={onDeleted}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ChevronDown, Settings } from "lucide-react";
import { formatBRL } from "@/lib/planning/planningFormat";
import type { PlanningApiRecurringBill } from "@/lib/planning/types";
import { HorizontalSnapCarousel } from "./HorizontalSnapCarousel";
import { EditRecurringBillsModal } from "./EditRecurringBillsModal";

interface RecurringPlanningSectionProps {
  items: PlanningApiRecurringBill[];
  onToggleActive: (id: string, active: boolean) => void;
  onChanged?: () => void;
}

export function RecurringPlanningSection({
  items,
  onToggleActive,
  onChanged,
}: RecurringPlanningSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const activeCount = items.filter((i) => i.active).length;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center justify-between rounded-xl py-1 text-left"
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-[var(--nyx-gradient-end)]" />
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Contas mensais</h2>
            <span className="rounded-md bg-[var(--muted)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]">
              {activeCount}/{items.length}
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-[var(--muted-foreground)] transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[var(--muted-foreground)] transition hover:border-violet-400/35 hover:bg-violet-500/10 hover:text-violet-200"
          aria-label="Editar contas mensais"
          title="Editar contas mensais"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-visible"
          >
            {items.length === 0 ? (
              <div className="dashboard-card p-6 text-center text-sm text-[var(--muted-foreground)]">
                Nenhuma conta mensal.{" "}
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="font-medium text-[var(--nyx-gradient-start)] underline-offset-2 hover:underline"
                >
                  Adicionar agora
                </button>
              </div>
            ) : (
              <HorizontalSnapCarousel
                dotCount={items.length}
                slideClassName="min-w-[80%] shrink-0 snap-start sm:min-w-[300px]"
              >
                {items.map((item) => {
                  const active = item.active;
                  return (
                    <article key={item.id} className="dashboard-card h-full p-4">
                      <p className="font-medium text-[var(--foreground)]">{item.title}</p>
                      <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                        {formatBRL(item.amount)}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        Dia {item.dueDay}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {active ? "Ativa" : "Pausada"}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={active}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleActive(item.id, !active);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          className={`relative h-7 w-12 rounded-full transition ${
                            active
                              ? "bg-gradient-to-r from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)]"
                              : "bg-[var(--muted)]"
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                              active ? "left-6" : "left-1"
                            }`}
                          />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </HorizontalSnapCarousel>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <EditRecurringBillsModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          onChanged?.();
        }}
        onChanged={onChanged}
      />
    </section>
  );
}

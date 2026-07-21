"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, X } from "lucide-react";
import type { DateRange } from "./types";

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  onClose: () => void;
  isOpen: boolean;
}

function formatMonthYear(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(d);
}

function formatShortRange(start: Date, end: Date) {
  return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;
}

const PRESETS = [
  {
    id: "7d",
    label: "Últimos 7 dias",
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
  },
  {
    id: "30d",
    label: "Últimos 30 dias",
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
  },
  {
    id: "month",
    label: "Este mês",
    getRange: () => {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      };
    },
  },
  {
    id: "prev-month",
    label: "Mês anterior",
    getRange: () => {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0),
      };
    },
  },
  {
    id: "next-month",
    label: "Mês seguinte",
    getRange: () => {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        end: new Date(now.getFullYear(), now.getMonth() + 2, 0),
      };
    },
  },
];

export function DateRangeFilter({
  value,
  onChange,
  onClose,
  isOpen,
}: DateRangeFilterProps) {
  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    const range = preset.getRange();
    onChange({
      start: range.start,
      end: range.end,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-[var(--border)] bg-[var(--card)] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                Filtrar período
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {PRESETS.map((preset) => {
                const range = preset.getRange();
                const isDefault = preset.id === "month";
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 hover:border-[var(--nyx-gradient-start)]/40 transition-colors text-left"
                  >
                    <Calendar
                      className={`w-5 h-5 ${
                        isDefault ? "text-[var(--nyx-gradient-start)]" : "text-[var(--muted-foreground)]"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {preset.label}
                        {isDefault && (
                          <span className="ml-2 text-xs text-[var(--nyx-gradient-start)]">
                            (padrão)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {preset.id === "month" ||
                        preset.id === "prev-month" ||
                        preset.id === "next-month"
                          ? formatMonthYear(range.start)
                          : formatShortRange(range.start, range.end)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { CategorySpending } from "./categorySpending";

interface ExpenseDonutProps {
  data: CategorySpending[];
  isLoading?: boolean;
  /** Categoria selecionada (slice clicado) */
  activeCategory?: string | null;
  /** Callback ao clicar em um slice */
  onCategoryClick?: (category: string) => void;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

/** Converte para formato do Recharts (name, value, color) */
function toChartData(data: CategorySpending[]): { name: string; value: number; color: string }[] {
  return data.map((d) => ({
    name: d.category,
    value: d.total,
    color: d.color,
  }));
}

function ExpenseDonutEmpty() {
  return (
    <motion.div
      className="dashboard-card dashboard-card-glow relative overflow-hidden p-8 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <p className="text-sm font-semibold text-[var(--foreground)] mb-2">
        Gastos por categoria
      </p>
      <p className="text-sm text-[var(--muted-foreground)]">
        Nenhuma despesa no período.
      </p>
    </motion.div>
  );
}

export function ExpenseDonut({
  data,
  isLoading = false,
  activeCategory = null,
  onCategoryClick,
}: ExpenseDonutProps) {
  const [localActive, setLocalActive] = useState<string | null>(null);
  const active = activeCategory ?? localActive;

  const handleCategorySelect = useCallback(
    (category: string) => {
      const next = active === category ? null : category;
      setLocalActive(next);
      onCategoryClick?.(next ?? "");
    },
    [active, onCategoryClick]
  );

  if (isLoading) {
    return (
      <motion.div
        className="dashboard-card dashboard-card-glow relative overflow-hidden p-4 sm:p-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-sm font-semibold text-[var(--foreground)] mb-4">
          Gastos por categoria
        </p>
        <div className="h-48 rounded-xl bg-[var(--muted)] animate-pulse" />
      </motion.div>
    );
  }

  if (data.length === 0) {
    return <ExpenseDonutEmpty />;
  }

  const chartData = toChartData(data);
  const activeItem = data.find((d) => d.category === active);

  return (
    <motion.div
      className="dashboard-card dashboard-card-glow relative overflow-hidden p-5 sm:p-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
    >
      <p className="text-sm font-semibold text-[var(--foreground)] mb-5">
        Gastos por categoria
      </p>

      <div className="h-48 sm:h-56 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="50%"
              outerRadius="75%"
              paddingAngle={2}
              dataKey="value"
              stroke="transparent"
            >
              {chartData.map((entry, index) => {
                const isActive = active === entry.name;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke={isActive ? "rgba(255,255,255,0.9)" : "transparent"}
                    strokeWidth={isActive ? 2 : 0}
                    opacity={isActive ? 1 : 0.88}
                    style={{
                      cursor: "pointer",
                      transition: "opacity 0.2s ease, stroke 0.2s ease",
                    }}
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {activeItem && (
        <motion.div
          className="mt-4 p-3 rounded-xl bg-[var(--muted)]/40 border border-[var(--border)]"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: activeItem.color }}
            />
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {activeItem.category}
            </p>
          </div>
          <p className="text-lg font-bold text-[var(--foreground)]">
            {formatCurrency(activeItem.total)}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {activeItem.percentage.toFixed(1)}%
          </p>
        </motion.div>
      )}

      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 donut-legend">
        {data.map((item) => (
          <button
            key={item.category}
            type="button"
            className="flex items-center gap-2 rounded-md hover:opacity-80 transition-opacity text-left"
            onClick={() => (onCategoryClick ? onCategoryClick(item.category) : handleCategorySelect(item.category))}
          >
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-white/50 shadow-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs font-medium text-[var(--foreground)] opacity-90">
              {item.category}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

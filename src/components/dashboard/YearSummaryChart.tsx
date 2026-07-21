"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface YearDataItem {
  month: string;
  ganhos: number;
  gastos: number;
}

interface YearSummaryChartProps {
  data: YearDataItem[];
  isLoading?: boolean;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

export function YearSummaryChart({ data, isLoading }: YearSummaryChartProps) {
  if (isLoading) {
    return (
      <motion.div
        className="dashboard-card dashboard-card-glow relative overflow-hidden p-4 sm:p-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-sm font-semibold text-[var(--foreground)] mb-4">
          Ganhos vs Gastos por mês
        </p>
        <div className="h-56 rounded-xl bg-[var(--muted)] animate-pulse" />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="dashboard-card dashboard-card-glow relative overflow-hidden p-4 sm:p-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
    >
      <p className="text-sm font-semibold text-[var(--foreground)] mb-4">
        Ganhos vs Gastos por mês
      </p>
      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis
              dataKey="month"
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              axisLine={{ stroke: "var(--border)" }}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              axisLine={{ stroke: "var(--border)" }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--foreground)" }}
              formatter={(value: number) => [formatCurrency(value), ""]}
              labelFormatter={(label) => `Mês: ${label}`}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value) => (
                <span style={{ color: "var(--muted-foreground)" }}>
                  {value === "ganhos" ? "Ganhos" : "Gastos"}
                </span>
              )}
            />
            <Bar
              dataKey="ganhos"
              fill="var(--nyx-gradient-end)"
              radius={[4, 4, 0, 0]}
              name="ganhos"
            />
            <Bar
              dataKey="gastos"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              name="gastos"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

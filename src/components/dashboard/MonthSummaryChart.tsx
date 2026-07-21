"use client";

import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MonthDataItem {
  day: string;
  ganhos: number;
  gastos: number;
}

interface MonthSummaryChartProps {
  data: MonthDataItem[];
  isLoading?: boolean;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

export function MonthSummaryChart({ data, isLoading }: MonthSummaryChartProps) {
  if (isLoading) {
    return (
      <motion.div
        className="dashboard-card dashboard-card-glow relative overflow-hidden p-4 sm:p-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-sm font-semibold text-[var(--foreground)] mb-4">
          Ganhos vs Gastos diários
        </p>
        <div className="h-48 rounded-xl bg-[var(--muted)] animate-pulse" />
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
        Ganhos vs Gastos diários
      </p>
      <div className="h-48 sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis
              dataKey="day"
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              axisLine={{ stroke: "var(--border)" }}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              axisLine={{ stroke: "var(--border)" }}
              tickFormatter={(v) => `${(v / 100).toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                fontSize: 12,
              }}
              formatter={(value: number) => [formatCurrency(value), ""]}
              labelFormatter={(label) => `Dia ${label}`}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value) => (
                <span style={{ color: "var(--muted-foreground)" }}>
                  {value === "ganhos" ? "Ganhos" : "Gastos"}
                </span>
              )}
            />
            <Line
              type="monotone"
              dataKey="ganhos"
              stroke="var(--nyx-gradient-end)"
              strokeWidth={2}
              dot={false}
              name="ganhos"
            />
            <Line
              type="monotone"
              dataKey="gastos"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="gastos"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

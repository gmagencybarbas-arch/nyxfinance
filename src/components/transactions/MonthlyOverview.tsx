"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useTransactions } from "./useTransactions";
import {
  getPreviousPeriod,
  computeTotal,
  computeWaveData,
  computeVariationPercent,
} from "./utils";
import type { DateRange } from "./types";

interface MonthlyOverviewProps {
  userId: string | null;
  dateRange: DateRange;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);
}

/** Skeleton do card (loading) */
function MonthlyOverviewSkeleton() {
  return (
    <motion.div
      className="dashboard-card p-5 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-[var(--muted)]/60 animate-pulse" />
          <div className="h-8 w-32 rounded bg-[var(--muted)]/50 animate-pulse" />
        </div>
        <div className="h-6 w-14 rounded bg-[var(--muted)]/50 animate-pulse" />
      </div>
      <div className="h-20 rounded-lg bg-[var(--muted)]/30 animate-pulse" />
    </motion.div>
  );
}

/** Fallback quando a API falha */
function MonthlyOverviewError() {
  return (
    <motion.div
      className="dashboard-card p-5 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <p className="text-sm text-[var(--muted-foreground)]">
        Não foi possível carregar o total do período.
      </p>
    </motion.div>
  );
}

export function MonthlyOverview({ userId, dateRange }: MonthlyOverviewProps) {
  const prevRange = useMemo(
    () => getPreviousPeriod(dateRange),
    [dateRange.start.getTime(), dateRange.end.getTime()]
  );

  const current = useTransactions(userId, dateRange);
  const previous = useTransactions(userId, prevRange);

  const overview = useMemo(() => {
    const total = computeTotal(current.data);
    const prevTotal = computeTotal(previous.data);
    const variation = computeVariationPercent(total, prevTotal);
    const waveData = computeWaveData(current.data, dateRange);
    return { total, variation, waveData };
  }, [
    current.data,
    previous.data,
    dateRange.start.getTime(),
    dateRange.end.getTime(),
  ]);

  if (current.loading || previous.loading) {
    return <MonthlyOverviewSkeleton />;
  }

  if (current.error) {
    return <MonthlyOverviewError />;
  }

  const isPositive = overview.variation >= 0;

  return (
    <motion.div
      className="dashboard-card p-5 overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
            Total do período
          </p>
          <p className="text-2xl font-semibold bg-gradient-to-r from-[var(--nyx-gradient-start)] to-[var(--nyx-gradient-end)] bg-clip-text text-transparent mt-0.5">
            {formatCurrency(overview.total)}
          </p>
        </div>
        <span
          className={`text-sm font-medium px-2.5 py-1 rounded-lg ${
            isPositive
              ? "bg-emerald-500/20 text-emerald-500"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}
          {overview.variation}%
        </span>
      </div>
      <div className="h-20 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={overview.waveData}
            margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
          >
            <defs>
              <linearGradient id="monthlyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--nyx-gradient-start)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--nyx-gradient-end)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" hide />
            <YAxis hide />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--nyx-gradient-start)"
              strokeWidth={1.5}
              fill="url(#monthlyGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

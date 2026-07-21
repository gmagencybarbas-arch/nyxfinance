"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Container } from "@/components/ui";
import {
  UserHeader,
  BalanceCard,
  ExpenseDonut,
  RecentTransactions,
  NyxInsightCard,
  SummaryToggle,
  YearSummaryChart,
  MonthSummaryChart,
  CategoryBreakdown,
  MOCK_YEAR_SUMMARY,
  MOCK_MONTH_SUMMARY,
  MOCK_CATEGORIES,
} from "@/components/dashboard";
import { useTransactions } from "@/components/transactions/useTransactions";
import { useFinancialInsights } from "@/hooks/useFinancialInsights";
import { computeCategorySpending } from "@/components/dashboard/categorySpending";
import type { DateRange } from "@/components/transactions/types";
import type { SummaryMode } from "@/components/dashboard";
import { AddEntryButton } from "@/components/planning/add-entry/AddEntryButton";

function getDefaultDateRange(): DateRange {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}

export function DashboardContent({
  userName,
  userAvatarUrl,
}: {
  userName?: string | null;
  userAvatarUrl?: string | null;
}) {
  const { user } = useAuth();
  const [dateRange] = useState<DateRange>(getDefaultDateRange);
  const [summaryMode, setSummaryMode] = useState<SummaryMode>("month");
  const [activeDonutCategory, setActiveDonutCategory] = useState<string | null>(null);

  const { data: transactions, loading, error, refetch } = useTransactions(
    user?.id ?? null,
    dateRange
  );

  const {
    primary: primaryInsight,
    briefMessage,
    loading: insightsLoading,
  } = useFinancialInsights(user?.id ?? null, {
    projectionMonths: 8,
    lookbackMonths: 1,
  });

  const balance = useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const categorySpending = useMemo(
    () => computeCategorySpending(transactions),
    [transactions]
  );

  const recentList = useMemo(
    () =>
      transactions
        .slice(0, 5)
        .map((t) => ({ ...t, date: t.dateLabel })),
    [transactions]
  );

  const handleDonutCategoryClick = useCallback((category: string) => {
    setActiveDonutCategory((prev) => (prev === category ? null : category));
  }, []);

  const isLoading = loading;
  const showError = error && transactions.length === 0;

  return (
    <main className="py-6 pb-24 md:pb-8">
      <Container size="sm" className="space-y-6 dashboard-sections">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <UserHeader name={userName} avatarUrl={userAvatarUrl} />
          <AddEntryButton
            onSaved={refetch}
            label="Novo lançamento"
            successMessage="Lançamento salvo."
            className="w-auto shrink-0"
          />
        </div>
        <BalanceCard
          balance={balance}
          isLoading={isLoading}
        />
        {showError ? (
          <motion.div
            className="dashboard-card p-5 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-sm text-[var(--muted-foreground)]">
              Não foi possível carregar os dados. Tente novamente.
            </p>
          </motion.div>
        ) : (
          <>
            <ExpenseDonut
              data={categorySpending}
              isLoading={isLoading}
              activeCategory={activeDonutCategory}
              onCategoryClick={handleDonutCategoryClick}
            />
            <RecentTransactions
              transactions={recentList}
              isLoading={isLoading}
            />
          </>
        )}
        <NyxInsightCard
          message={primaryInsight?.message ?? briefMessage}
          severity={primaryInsight?.severity}
          isLoading={insightsLoading}
        />

        <motion.div
          className="flex justify-center pt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <SummaryToggle value={summaryMode} onChange={setSummaryMode} />
        </motion.div>

        {summaryMode === "year" ? (
          <motion.div
            key="year"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <YearSummaryChart data={MOCK_YEAR_SUMMARY} isLoading={false} />
          </motion.div>
        ) : (
          <motion.div
            key="month"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <MonthSummaryChart data={MOCK_MONTH_SUMMARY} isLoading={false} />
          </motion.div>
        )}

        <CategoryBreakdown
          categories={MOCK_CATEGORIES}
          mode={summaryMode}
          isLoading={false}
        />
      </Container>
    </main>
  );
}

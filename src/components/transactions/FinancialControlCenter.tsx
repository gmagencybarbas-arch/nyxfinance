"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { TransactionsHeader } from "./TransactionsHeader";
import { MonthlyOverview } from "./MonthlyOverview";
import { NyxQuickInsight } from "./NyxQuickInsight";
import { TransactionsTabs } from "./TransactionsTabs";
import { TransactionList } from "./TransactionList";
import { CategorySummaryTab } from "./CategorySummaryTab";
import { AnalysisTab } from "./AnalysisTab";
import { DateRangeFilter } from "./DateRangeFilter";
import { useTransactions } from "./useTransactions";
import { MOCK_NYX_QUICK_INSIGHT } from "./mockData";
import type { DateRange, TransactionTab } from "./types";

function getDefaultDateRange(): DateRange {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}

export function FinancialControlCenter() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  const [activeTab, setActiveTab] = useState<TransactionTab>("historico");
  const [filterOpen, setFilterOpen] = useState(false);

  const {
    data: transactions,
    loading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useTransactions(user?.id ?? null, dateRange);

  return (
    <div className="space-y-6">
      <TransactionsHeader onFilterClick={() => setFilterOpen(true)} />

      <MonthlyOverview userId={user?.id ?? null} dateRange={dateRange} />

      <NyxQuickInsight message={MOCK_NYX_QUICK_INSIGHT} />

      <TransactionsTabs value={activeTab} onChange={setActiveTab} />

      <AnimatePresence mode="wait">
        {activeTab === "historico" && (
          <motion.div
            key="historico"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <TransactionList
              source={
                transactionsLoading
                  ? { mode: "static", transactions: [] }
                  : { mode: "static", transactions }
              }
              loadingOverride={transactionsLoading}
              errorOverride={transactionsError}
              onDeleted={refetchTransactions}
            />
          </motion.div>
        )}
        {activeTab === "categorias" && (
          <motion.div
            key="categorias"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <CategorySummaryTab
              transactions={transactions}
              loading={transactionsLoading}
              error={transactionsError}
            />
          </motion.div>
        )}
        {activeTab === "analise" && (
          <motion.div
            key="analise"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <AnalysisTab />
          </motion.div>
        )}
      </AnimatePresence>

      <DateRangeFilter
        value={dateRange}
        onChange={setDateRange}
        onClose={() => setFilterOpen(false)}
        isOpen={filterOpen}
      />
    </div>
  );
}

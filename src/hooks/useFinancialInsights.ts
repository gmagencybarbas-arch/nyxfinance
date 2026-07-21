"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProfileIdentity } from "@/components/profile/types";
import {
  formatInsightsAsBrief,
  generateInsightsFromBuildInput,
  pickPrimaryInsight,
  pickTopInsights,
} from "@/lib/insights";
import type { FinancialInsight } from "@/lib/insights";
import { loadProfileIdentity } from "@/lib/planning/profileStorage";
import { monthKeyFromDate, parseMonthKey } from "@/lib/planning/planningFormat";
import type { PlanningApiPayload } from "@/lib/planning/types";

export type UseFinancialInsightsOptions = {
  monthKey?: string;
  /** Meses de projeção para regras de pressão futura. */
  projectionMonths?: number;
  /** Inclui mês anterior no payload para variação de gastos. */
  lookbackMonths?: number;
  enabled?: boolean;
};

export function useFinancialInsights(
  userId: string | null,
  options: UseFinancialInsightsOptions = {}
) {
  const {
    monthKey: monthKeyProp,
    projectionMonths = 8,
    lookbackMonths = 1,
    enabled = true,
  } = options;

  const focusMonthKey = monthKeyProp ?? monthKeyFromDate(new Date());
  const { year, month } = parseMonthKey(focusMonthKey);

  const [payload, setPayload] = useState<PlanningApiPayload | null>(null);
  const [identity, setIdentity] = useState<ProfileIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIdentity(loadProfileIdentity());
  }, []);

  const fetchInsightsData = useCallback(async () => {
    if (!userId || !enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/planning?year=${year}&month=${month}&projectionMonths=${projectionMonths}&lookbackMonths=${lookbackMonths}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string; detail?: string }).detail ??
            (body as { error?: string }).error ??
            "Falha ao carregar insights"
        );
      }
      const data = (await res.json()) as PlanningApiPayload;
      setPayload({
        ...data,
        recurringBills: data.recurringBills ?? [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [userId, year, month, projectionMonths, lookbackMonths, enabled]);

  useEffect(() => {
    fetchInsightsData();
  }, [fetchInsightsData]);

  const recentTransactions = useMemo(() => {
    if (!payload) return undefined;
    return payload.transactions.map((t) => ({
      type: t.type,
      amount: t.amount,
      category: t.category,
      occurredAt: t.occurredAt,
    }));
  }, [payload]);

  const insights: FinancialInsight[] = useMemo(() => {
    if (!payload) return [];
    return generateInsightsFromBuildInput({
      payload,
      focusMonthKey,
      identity,
      recentTransactions,
      projectionMonths,
    });
  }, [payload, focusMonthKey, identity, recentTransactions, projectionMonths]);

  const primary = useMemo(() => pickPrimaryInsight(insights), [insights]);
  const topInsights = useMemo(() => pickTopInsights(insights, 5), [insights]);
  const briefMessage = useMemo(() => formatInsightsAsBrief(insights), [insights]);

  return {
    insights,
    topInsights,
    primary,
    briefMessage,
    loading,
    error,
    refetch: fetchInsightsData,
  };
}

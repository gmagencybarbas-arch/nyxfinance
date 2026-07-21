"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProfileIdentity } from "@/components/profile/types";
import { useProfile } from "@/contexts/ProfileContext";
import {
  buildMonthPlanning,
  buildProjection,
  patchRecurringInPayload,
} from "@/lib/planning/planningEngine";
import {
  addMonthsToKey,
  monthKeyFromDate,
  parseMonthKey,
} from "@/lib/planning/planningFormat";
import { loadProfileIdentity, mergeProfileIdentity } from "@/lib/planning/profileStorage";
import type { MonthPlanningView, PlanningApiPayload, ProjectionMonth } from "@/lib/planning/types";
export function usePlanning(userId: string | null) {
  const profileCtx = useProfile();
  const profile = profileCtx?.profile ?? null;
  const now = useMemo(() => new Date(), []);
  const [monthKey, setMonthKey] = useState(() => monthKeyFromDate(now));
  const [payload, setPayload] = useState<PlanningApiPayload | null>(null);
  const [identity, setIdentity] = useState<ProfileIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { year, month } = parseMonthKey(monthKey);

  const refreshIdentity = useCallback(() => {
    const local = loadProfileIdentity();
    setIdentity(
      mergeProfileIdentity(local, profile
        ? {
            displayName: profile.displayName,
            profession: profile.profession,
            jobTitle: profile.jobTitle,
            salaryRange: profile.salaryRange,
            payday: profile.payday,
            financialGoal: profile.financialGoal,
          }
        : null)
    );
  }, [profile]);

  useEffect(() => {
    refreshIdentity();
  }, [refreshIdentity]);

  useEffect(() => {
    const onFocus = () => refreshIdentity();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshIdentity]);

  const fetchPlanning = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/planning?year=${year}&month=${month}&projectionMonths=12&lookbackMonths=1`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string; detail?: string }).detail ??
            (body as { error?: string }).error ??
            "Falha ao carregar"
        );
      }
      const data = (await res.json()) as PlanningApiPayload;
      setPayload({
        ...data,
        recurringBills: data.recurringBills ?? [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar planejamento");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [userId, year, month]);

  useEffect(() => {
    fetchPlanning();
  }, [fetchPlanning]);

  const monthView: MonthPlanningView | null = useMemo(() => {
    if (!payload) return null;
    return buildMonthPlanning(monthKey, payload, identity);
  }, [payload, monthKey, identity]);

  const projection: ProjectionMonth[] = useMemo(() => {
    if (!payload) return [];
    return buildProjection(monthKey, 6, payload, identity);
  }, [payload, monthKey, identity]);

  const recurring = useMemo(() => payload?.recurringBills ?? [], [payload]);

  const goMonth = useCallback((delta: number) => {
    setMonthKey((k) => addMonthsToKey(k, delta));
  }, []);

  const goToToday = useCallback(() => {
    setMonthKey(monthKeyFromDate(new Date()));
  }, []);

  const selectMonthKey = useCallback((key: string) => {
    setMonthKey(key);
  }, []);

  const toggleRecurringActive = useCallback(async (id: string, active: boolean) => {
    setPayload((prev) => (prev ? patchRecurringInPayload(prev, id, active) : prev));
    try {
      const res = await fetch(`/api/recurring-bills/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar");
    } catch {
      await fetchPlanning();
    }
  }, [fetchPlanning]);

  const quickMonths = useMemo(() => {
    const base = monthKeyFromDate(now);
    return [
      { key: base, label: "Atual" },
      { key: addMonthsToKey(base, 1), label: "Próximo" },
      { key: addMonthsToKey(base, 3), label: "+3 meses" },
    ];
  }, [now]);

  return {
    monthKey,
    monthView,
    projection,
    recurring,
    loading,
    error,
    goMonth,
    goToToday,
    selectMonthKey,
    toggleRecurringActive,
    quickMonths,
    refetch: fetchPlanning,
  };
}

"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  apiRowsToTransactions,
  type ApiTransactionRow,
} from "./transactionListMappers";
import type { Transaction } from "./mockData";
import type { DateRange } from "./types";

/** Lançamentos visíveis na dashboard e listas (exclui só cancelados). */
function isVisibleTransaction(status: string): boolean {
  return status !== "CANCELED";
}

export interface UseTransactionsResult {
  data: Transaction[];
  loading: boolean;
  error: boolean;
  refetch: () => void;
}

/**
 * Hook reutilizável: busca transações em /api/transactions para o período.
 * Inclui PENDING e COMPLETED (todo gasto/receita lançado aparece na dashboard).
 * Aborta fetch anterior ao mudar userId/dateRange; memoiza resultado.
 */
export function useTransactions(
  userId: string | null,
  dateRange: DateRange
): UseTransactionsResult {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [refetchTick, setRefetchTick] = useState(0);
  const fromStr = dateRange.start.toISOString().slice(0, 10);
  const toStr = dateRange.end.toISOString().slice(0, 10);

  const fetchTransactions = useCallback(async (signal: AbortSignal) => {
    if (!userId) {
      setData([]);
      setLoading(false);
      setError(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const url = `/api/transactions?userId=${encodeURIComponent(userId)}&from=${fromStr}&to=${toStr}`;
      const res = await fetch(url, { signal });
      if (!res.ok) {
        setData([]);
        setError(true);
        return;
      }
      const rows = (await res.json()) as ApiTransactionRow[];
      const visible = rows.filter((r) => isVisibleTransaction(r.status));
      const mapped = apiRowsToTransactions(visible);
      setData(mapped);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setData([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId, fromStr, toStr]);

  useEffect(() => {
    if (!userId) {
      setData([]);
      setLoading(false);
      setError(false);
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    fetchTransactions(ac.signal);
    return () => {
      ac.abort();
      abortRef.current = null;
    };
  }, [userId, fromStr, toStr, fetchTransactions, refetchTick]);

  const refetch = useCallback(() => {
    setRefetchTick((n) => n + 1);
  }, []);

  return useMemo(
    () => ({ data, loading, error, refetch }),
    [data, loading, error, refetch]
  );
}

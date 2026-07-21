import type { Transaction } from "./mockData";
import type { DateRange } from "./types";

export function parseTransactionDate(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isInRange(dateStr: string, range: DateRange): boolean {
  const d = parseTransactionDate(dateStr);
  const start = new Date(range.start);
  const end = new Date(range.end);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return d >= start && d <= end;
}

export function filterTransactions(
  transactions: Transaction[],
  range: DateRange
): Transaction[] {
  return transactions.filter((t) => isInRange(t.date, range));
}

export function getPreviousPeriod(range: DateRange): DateRange {
  const ms = range.end.getTime() - range.start.getTime();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1;
  return {
    start: new Date(range.start.getTime() - days * 24 * 60 * 60 * 1000),
    end: new Date(range.start.getTime() - 24 * 60 * 60 * 1000),
  };
}

export function computeTotal(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

export function computeWaveData(
  transactions: Transaction[],
  range: DateRange
): { day: string; value: number }[] {
  const start = new Date(range.start);
  const end = new Date(range.end);
  const result: { day: string; value: number }[] = [];
  let cumulative = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const dayTransactions = transactions.filter((t) => t.date <= key);
    cumulative = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
    result.push({
      day: d.getDate().toString(),
      value: Math.round(cumulative * 100) / 100,
    });
  }

  return result;
}

export function computeVariationPercent(
  currentTotal: number,
  previousTotal: number
): number {
  if (previousTotal === 0) return currentTotal > 0 ? 100 : 0;
  return Math.round(((currentTotal - previousTotal) / Math.abs(previousTotal)) * 1000) / 10;
}

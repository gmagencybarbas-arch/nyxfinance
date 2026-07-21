const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export function parseMonthKey(key: string): { year: number; month: number } {
  const [y, m] = key.split("-").map(Number);
  return { year: y, month: m };
}

export function toMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function monthKeyFromDate(d: Date): string {
  return toMonthKey(d.getFullYear(), d.getMonth() + 1);
}

export function monthLabel(key: string, short = false): string {
  const { year, month } = parseMonthKey(key);
  const name = MONTH_NAMES[month - 1] ?? "";
  if (short) return `${name.slice(0, 3)} ${String(year).slice(2)}`;
  return `${name} ${year}`;
}

export function startOfMonth(year: number, month: number): Date {
  return new Date(year, month - 1, 1, 0, 0, 0, 0);
}

export function endOfMonth(year: number, month: number): Date {
  return new Date(year, month, 0, 23, 59, 59, 999);
}

export function addMonthsToKey(key: string, delta: number): string {
  const { year, month } = parseMonthKey(key);
  const d = new Date(year, month - 1 + delta, 1);
  return toMonthKey(d.getFullYear(), d.getMonth() + 1);
}

export function formatBRL(value: number, decimals = 0): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
}

export function formatDueLabel(date: Date): string {
  const day = date.getDate();
  const mon = MONTH_NAMES[date.getMonth()]?.slice(0, 3) ?? "";
  return `dia ${day} · ${day} ${mon}`;
}

export function clampDayInMonth(year: number, month: number, day: number): Date {
  const last = new Date(year, month, 0).getDate();
  return new Date(year, month - 1, Math.min(day, last), 12, 0, 0, 0);
}

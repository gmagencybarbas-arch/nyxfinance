/** Estilos e utilitários compartilhados pelos formulários de lançamento. */

export const inputClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--input)] px-3.5 py-3 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--nyx-gradient-start)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--nyx-gradient-start)]/30 transition";

export const labelClass = "mb-1.5 block text-sm font-medium text-[var(--foreground)]";

export function parseBRLAmount(raw: string): number | null {
  const normalized = raw.trim().replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

/** Converte yyyy-mm-dd para ISO com meio-dia local (evita shift de fuso). */
export function dateInputToIso(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
  return date.toISOString();
}

export function todayDateInputValue(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function clampInt(raw: string, min: number, max: number, fallback: number): number {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

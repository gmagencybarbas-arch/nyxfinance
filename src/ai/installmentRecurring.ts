/**
 * Inferência determinística de parcelamento e contas com dia fixo no mês.
 */

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Próxima ocorrência do dia do mês (>= ref); trata meses curtos. */
export function nextCalendarDateForDayOfMonth(dayOfMonth: number, ref: Date): Date {
  const refDay = startOfLocalDay(ref);
  const y = refDay.getFullYear();
  const m = refDay.getMonth();
  const clamp = (y0: number, m0: number, d: number) => {
    const last = new Date(y0, m0 + 1, 0).getDate();
    const day = Math.min(d, last);
    return new Date(y0, m0, day);
  };
  let cand = clamp(y, m, dayOfMonth);
  if (cand.getTime() < refDay.getTime()) {
    const nm = m === 11 ? 0 : m + 1;
    const ny = m === 11 ? y + 1 : y;
    cand = clamp(ny, nm, dayOfMonth);
  }
  return startOfLocalDay(cand);
}

/** "todo dia 5", "todos os dias 5", "no dia 5 todo mês" */
export function extractRecurringMonthlyDay(ascii: string): number | null {
  const p1 = ascii.match(/\b(?:todo|todos)\s+(?:o\s+)?dia\s+(\d{1,2})\b/i);
  if (p1) {
    const d = parseInt(p1[1], 10);
    if (d >= 1 && d <= 31) return d;
  }
  const p2 = ascii.match(/\bdia\s+(\d{1,2})\s+(?:de\s+)?(?:todo|todos)\s+o?\s*mes\b/i);
  if (p2) {
    const d = parseInt(p2[1], 10);
    if (d >= 1 && d <= 31) return d;
  }
  const p3 = ascii.match(/\b(?:mensalmente|todo\s+mes|todos\s+os\s+meses)\s+(?:no\s+)?dia\s+(\d{1,2})\b/i);
  if (p3) {
    const d = parseInt(p3[1], 10);
    if (d >= 1 && d <= 31) return d;
  }
  return null;
}

export function userDeclaresOneShotOnly(ascii: string): boolean {
  return /\b(uma vez so|so uma vez|uma vez|avulso|só esse mes|so esse mes|só este mes|so este mes|só agora)\b/i.test(
    ascii
  );
}

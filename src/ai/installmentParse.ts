/**
 * Parser determinístico de parcelamento — várias formas naturais (PT-BR).
 */

export type InstallmentParseResult =
  | {
      kind: "full";
      count: number;
      amountEach: number;
      firstDueDay?: number;
    }
  | { kind: "need_amount"; count: number; firstDueDay?: number }
  | { kind: "need_count"; amountEach: number; firstDueDay?: number }
  | { kind: "none" };

function asciiNorm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseMoney(s: string): number {
  return parseFloat(s.replace(/\./g, "").replace(",", "."));
}

function extractFirstDueDay(ascii: string): number | undefined {
  const p1 = ascii.match(
    /\b(?:primeir[ao]|1a|1ª)\s+(?:parcela\s+)?vence(?:\s+no)?\s+dia\s+(\d{1,2})\b/i
  );
  const p2 = ascii.match(/\bvence(?:\s+no)?\s+dia\s+(\d{1,2})\b/i);
  const p3 = ascii.match(/\b1a\s+parcela\s+dia\s+(\d{1,2})\b/i);
  const p4 = ascii.match(/\bprimeira\s+parcela\s+(?:no\s+)?dia\s+(\d{1,2})\b/i);
  const p5 = ascii.match(/\bparcela\s+dia\s+(\d{1,2})\b/i);
  const installmentProbe =
    /\b(parcelei|parcelado|parcelada|parcelados|parceladas|parcela|parcelas|financiei|vezes)\b/i.test(
      ascii
    ) ||
    /\b\d{1,3}\s*x\b/i.test(ascii) ||
    /\bx\s*\d{1,3}\b/i.test(ascii) ||
    /\bem\s+\d{1,3}\s*(?:parcelas?|x|vezes)\b/i.test(ascii);
  const p6 = installmentProbe
    ? ascii.match(/\b(?:no\s+)?dia\s+(\d{1,2})\b/i)
    : null;
  const pick = p1?.[1] ?? p2?.[1] ?? p3?.[1] ?? p4?.[1] ?? p5?.[1] ?? p6?.[1];
  if (!pick) return undefined;
  const d = parseInt(pick, 10);
  return d >= 1 && d <= 31 ? d : undefined;
}

export function hasInstallmentIntent(ascii: string): boolean {
  return (
    /\b(parcelei|parcelado|parcelada|parcelados|parceladas|parcela|parcelas|financiei|vezes)\b/i.test(
      ascii
    ) ||
    /\b\d{1,3}\s*x\b/i.test(ascii) ||
    /\bx\s*\d{1,3}\b/i.test(ascii) ||
    /\bem\s+\d{1,3}\s*(?:parcelas?|x|vezes)\b/i.test(ascii)
  );
}

function validCount(n: number): boolean {
  return n >= 2 && n <= 360;
}

function full(
  count: number,
  amount: number,
  ascii: string
): InstallmentParseResult | null {
  if (!validCount(count) || !Number.isFinite(amount) || amount <= 0) return null;
  return {
    kind: "full",
    count,
    amountEach: amount,
    firstDueDay: extractFirstDueDay(ascii),
  };
}

type Rule = { re: RegExp; pick: (m: RegExpMatchArray) => { c: number; a: number } | null };

const PAIR_RULES: Rule[] = [
  {
    re: /\br\$\s*(\d+(?:[.,]\d{1,2})?)\s+.*?em\s+(\d{1,3})\s*(?:parcelas?|x|vezes)\b/i,
    pick: (m) => ({ a: parseMoney(m[1]), c: parseInt(m[2], 10) }),
  },
  {
    re: /\bem\s+(\d{1,3})\s*(?:parcelas?|vezes)\s+de\s*(\d+(?:[.,]\d{1,2})?)\b/i,
    pick: (m) => ({ c: parseInt(m[1], 10), a: parseMoney(m[2]) }),
  },
  {
    re: /\bem\s+(\d{1,3})\s*x\s*(?:de\s*)?(\d+(?:[.,]\d{1,2})?)\b/i,
    pick: (m) => ({ c: parseInt(m[1], 10), a: parseMoney(m[2]) }),
  },
  {
    re: /\b(\d{1,3})\s*parcelas?\s+de\s*(\d+(?:[.,]\d{1,2})?)\b/i,
    pick: (m) => ({ c: parseInt(m[1], 10), a: parseMoney(m[2]) }),
  },
  {
    re: /\b(\d{1,3})\s*vezes?\s+de\s*(\d+(?:[.,]\d{1,2})?)\b/i,
    pick: (m) => ({ c: parseInt(m[1], 10), a: parseMoney(m[2]) }),
  },
  {
    re: /\b(\d{1,3})\s*x\s*(?:de\s*)?(\d+(?:[.,]\d{1,2})?)\b/i,
    pick: (m) => ({ c: parseInt(m[1], 10), a: parseMoney(m[2]) }),
  },
  {
    re: /\b(\d+(?:[.,]\d{1,2})?)\s+em\s+(\d{1,3})\s*(?:x|parcelas?|vezes)\b/i,
    pick: (m) => ({ a: parseMoney(m[1]), c: parseInt(m[2], 10) }),
  },
  {
    re: /\b(\d+(?:[.,]\d{1,2})?)\s+(\d{1,3})\s*x\b/i,
    pick: (m) => ({ a: parseMoney(m[1]), c: parseInt(m[2], 10) }),
  },
  {
    re: /\b(\d{1,3})\s*x\s+(\d+(?:[.,]\d{1,2})?)\b/i,
    pick: (m) => ({ c: parseInt(m[1], 10), a: parseMoney(m[2]) }),
  },
];

export function parseInstallmentContext(raw: string): InstallmentParseResult {
  const ascii = asciiNorm(raw);
  const fd = extractFirstDueDay(ascii);

  for (const { re, pick } of PAIR_RULES) {
    const m = ascii.match(re);
    if (!m) continue;
    const p = pick(m);
    if (!p) continue;
    const hit = full(p.c, p.a, ascii);
    if (hit) return hit;
  }

  const countOnly = ascii.match(
    /\b(?:em\s+)?(\d{1,3})\s*(?:x|parcelas?|vezes)(?!\s*(?:de\s*)?\d)/i
  );
  if (countOnly && hasInstallmentIntent(ascii)) {
    const c = parseInt(countOnly[1], 10);
    if (validCount(c)) {
      return { kind: "need_amount", count: c, firstDueDay: fd };
    }
  }

  if (hasInstallmentIntent(ascii) && !/\b\d{1,3}\s*x\s*(?:de\s*)?\d/i.test(ascii)) {
    const am = ascii.match(/\b(\d+(?:[.,]\d{1,2})?)\s*reais?\b/i);
    const am2 = ascii.match(/\br\$\s*(\d+(?:[.,]\d{1,2})?)/i);
    const rawNum = ascii.match(/\b(\d{3,}(?:[.,]\d{1,2})?)\b/);
    const val = am
      ? parseMoney(am[1])
      : am2
        ? parseMoney(am2[1])
        : rawNum
          ? parseMoney(rawNum[1])
          : NaN;
    if (Number.isFinite(val) && val > 0) {
      return { kind: "need_count", amountEach: val, firstDueDay: fd };
    }
  }

  return { kind: "none" };
}

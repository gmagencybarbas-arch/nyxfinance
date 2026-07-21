import { normalizeForMatch, normalizeToken, normalizeText } from "./normalizeText";
import type { TemporalExtraction } from "./types";

export const MONTH_NAMES_ASCII = [
  "janeiro",
  "fevereiro",
  "marco",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

export const MONTH_NAME_TO_INDEX: Record<string, number> = {
  janeiro: 0,
  fevereiro: 1,
  marco: 2,
  abril: 3,
  maio: 4,
  junho: 5,
  julho: 6,
  agosto: 7,
  setembro: 8,
  outubro: 9,
  novembro: 10,
  dezembro: 11,
};

const MONTH_PATTERN = MONTH_NAMES_ASCII.join("|");

const TEMPORAL_PATTERNS: RegExp[] = [
  /\bsegunda-feira\b/gi,
  /\bterca-feira\b/gi,
  /\bterça-feira\b/gi,
  /\bquarta-feira\b/gi,
  /\bquinta-feira\b/gi,
  /\bsexta-feira\b/gi,
  /\bsegunda\s+feira\b/gi,
  /\bterca\s+feira\b/gi,
  /\bterça\s+feira\b/gi,
  /\bquarta\s+feira\b/gi,
  /\bquinta\s+feira\b/gi,
  /\bsexta\s+feira\b/gi,
  /\b(domingo|segunda|terca|terça|quarta|quinta|sexta|sabado|sábado)\s+retrasad[ao]\b/gi,
  /\b(domingo|segunda|terca|terça|quarta|quinta|sexta|sabado|sábado)\s+passad[ao]\b/gi,
  /\b(hoje|ontem|anteontem|amanha|amanhã)\b/gi,
  /\b(domingo|segunda|terca|terça|quarta|quinta|sexta|sabado|sábado)(\s+feira)?\b/gi,
  /\bdia\s+\d{1,2}\s+de\s+(janeiro|fevereiro|marco|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/gi,
  /\b\d{1,2}\s+de\s+(janeiro|fevereiro|marco|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/gi,
  /\bdia\s+\d{1,2}\b/gi,
  /\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/g,
  new RegExp(`\\bem\\s+(${MONTH_PATTERN})\\b`, "gi"),
  new RegExp(`\\bno\\s+(${MONTH_PATTERN})\\b`, "gi"),
  new RegExp(`\\bn?o\\s+mes\\s+de\\s+(${MONTH_PATTERN})\\b`, "gi"),
];

/** Indica se o texto traz pista explícita de data (parser + confirmação). */
export function hasExplicitDateHint(text: string): boolean {
  const n = normalizeText(text);
  const a = normalizeForMatch(n);
  if (
    /\b(hoje|ontem|anteontem|amanha|amanhã)\b/.test(a) ||
    /\b(domingo|segunda|terca|quarta|quinta|sexta|sabado)(?:-feira|\s+feira)?\b/.test(a)
  ) {
    return true;
  }
  if (/dia\s+\d{1,2}/.test(a)) return true;
  if (/\d{1,2}[/-]\d{1,2}/.test(a)) return true;
  if (new RegExp(`\\b\\d{1,2}\\s+de\\s+(${MONTH_PATTERN})\\b`).test(a)) return true;
  if (new RegExp(`\\bdia\\s+\\d{1,2}\\s+de\\s+(${MONTH_PATTERN})\\b`).test(a)) return true;
  if (new RegExp(`\\bem\\s+(${MONTH_PATTERN})\\b`).test(a)) return true;
  if (
    /\b(domingo|segunda|terca|quarta|quinta|sexta|sabado)(?:-feira| feira)?\s+passad/.test(a)
  ) {
    return true;
  }
  if (
    /\b(domingo|segunda|terca|quarta|quinta|sexta|sabado)(?:-feira| feira)?\s+retrasad/.test(a)
  ) {
    return true;
  }
  return false;
}

/** Mês sem dia: “em maio”, “no março”. */
export function extractMonthOnly(ascii: string): string | null {
  const m = ascii.match(new RegExp(`\\b(?:em|no)\\s+(${MONTH_PATTERN})\\b`));
  if (m?.[1]) return normalizeToken(m[1]);
  return null;
}

/** Remove trechos temporais — não devem virar descrição. */
export function extractTemporalContext(original: string, lower: string): TemporalExtraction {
  let remainder = lower;
  let explicit = hasExplicitDateHint(original);

  for (const re of TEMPORAL_PATTERNS) {
    remainder = remainder.replace(re, " ");
  }

  const monthOnly = extractMonthOnly(normalizeForMatch(original));
  if (monthOnly) {
    explicit = true;
    const monthRe = new RegExp(`\\b${monthOnly}\\b`, "gi");
    remainder = remainder.replace(monthRe, " ");
  }

  remainder = remainder.replace(/\s+/g, " ").trim();

  return { remainder, explicit, monthOnly };
}

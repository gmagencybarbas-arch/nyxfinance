/**
 * Nyx natural language transaction parser.
 * Extracts structured transaction data from free text (chat or voice transcript).
 *
 * Extensibility points:
 * - parseTransactionInput: can later call OpenAI for ambiguous inputs.
 * - suggestCategory: can be extended with user-specific learned patterns.
 * - parseNaturalDate: optional ref date (testes / consistência de "hoje").
 */

import { extractSemanticDescription } from "./semantic/pipeline";
import {
  extractMonthOnly,
  hasExplicitDateHint,
  MONTH_NAME_TO_INDEX,
} from "./semantic/temporalExtraction";
import { parseInstallmentContext } from "./installmentParse";
import {
  extractRecurringMonthlyDay,
  nextCalendarDateForDayOfMonth,
  userDeclaresOneShotOnly,
} from "./installmentRecurring";

export type InstallmentPlan = {
  count: number;
  amountEach: number;
  firstDueDate?: Date;
};

export type RecurringBill = {
  frequency: "monthly";
  dayOfMonth: number;
};

/** Passo conversacional interno (não persistido na API). */
export type NyxAwaitingStep =
  | "installment_first_due"
  | "installment_amount"
  | "installment_count"
  | "recurring_choice"
  | "commitment_track";

export type ParsedTransaction = {
  description: string;
  amount: number; // positive = income, negative = expense
  type: "income" | "expense";
  categorySuggested: string | null;
  date: Date;
  confidence: number; // 0–1
  /** Parcelamento cartão/loja — valor em `amount` é da parcela unitária. */
  installmentPlan?: InstallmentPlan;
  installmentAwaitingFirstDue?: boolean;
  /** Inferência parcial: falta o valor de cada parcela. */
  pendingInstallmentCount?: number;
  /** Dia do mês da 1ª parcela, se o utilizador já disse (ex.: "dia 12"). */
  pendingInstallmentFirstDueDay?: number;
  /** Falta só o número de parcelas (valor da parcela já conhecido). */
  pendingInstallmentAmountEach?: number;
  /** Conta com dia fixo no mês (ex.: aluguel dia 5). */
  recurringBill?: RecurringBill;
  /** Após pergunta recorrente: sim = lembrete; não = só este lançamento. */
  recurringAccepted?: boolean;
  /** Controle de diálogo multi-turno no cliente. */
  _nyxAwaiting?: NyxAwaitingStep;
  /** Mostrar data na frase de confirmação (só se explícita e não for “hoje”). */
  showDateInConfirmation?: boolean;
};

export type ParseResult =
  | { status: "success"; data: ParsedTransaction }
  | { status: "needs_confirmation"; data: ParsedTransaction; missing: string[] }
  | { status: "error"; reason: string };

export type ParseTransactionOptions = {
  /** Data de referência ("hoje") para datas relativas e confirmação de futuro. */
  refDate?: Date;
};

const INCOME_KEYWORDS = [
  "recebi",
  "ganhei",
  "entrou",
  "salário",
  "salario",
  "pagamento",
  "freelance",
] as const;

const EXPENSE_KEYWORDS = [
  "gastei",
  "paguei",
  "comprei",
  "ifood",
  "uber",
  "mercado",
  "farmácia",
  "farmacia",
  "academia",
  "netflix",
  "streaming",
  "gasolina",
  "estacionamento",
  "pix",
  "parcelei",
  "parcela",
  "parcelado",
  "financiei",
] as const;

/** Normalize string: lowercase + remove accents. Deterministic, no deps. */
function normalizeForMatch(s: string): string {
  const t = s.toLowerCase().trim();
  return t
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ");
}

/** Dice coefficient on character bigrams; 0..1. O(m+n). */
function diceBigramSimilarity(a: string, b: string): number {
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;
  const bigrams = (s: string): Set<string> => {
    const set = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    return set;
  };
  const sa = bigrams(a);
  const sb = bigrams(b);
  let intersection = 0;
  for (const x of sa) if (sb.has(x)) intersection++;
  return (2 * intersection) / (sa.size + sb.size);
}

/** Keywords → category name. Keys used accent-insensitive. Longest keys first via sort. */
const KEYWORD_TO_CATEGORY: Record<string, string> = {
  // Alimentação
  "uber eats": "Alimentação",
  macarrao: "Alimentação",
  macarrão: "Alimentação",
  hamburguer: "Alimentação",
  hambúrguer: "Alimentação",
  pastel: "Alimentação",
  acai: "Alimentação",
  açaí: "Alimentação",
  padaria: "Alimentação",
  restaurante: "Alimentação",
  almoco: "Alimentação",
  almoço: "Alimentação",
  janta: "Alimentação",
  jantar: "Alimentação",
  cafe: "Alimentação",
  café: "Alimentação",
  lanche: "Alimentação",
  ifood: "Alimentação",
  mercado: "Alimentação",
  supermercado: "Alimentação",
  atacadao: "Alimentação",
  atacadão: "Alimentação",
  pizzaria: "Alimentação",
  pizza: "Alimentação",
  pao: "Alimentação",
  pão: "Alimentação",
  alimentacao: "Alimentação",
  delivery: "Alimentação",
  // Transporte
  estacionamento: "Transporte",
  combustivel: "Transporte",
  combustível: "Transporte",
  gasolina: "Transporte",
  onibus: "Transporte",
  ônibus: "Transporte",
  metro: "Transporte",
  metrô: "Transporte",
  pedagio: "Transporte",
  pedágio: "Transporte",
  taxi: "Transporte",
  uber: "Transporte",
  "99": "Transporte",
  transporte: "Transporte",
  // Moradia / Casa
  condominio: "Casa",
  condomínio: "Casa",
  aluguel: "Casa",
  luz: "Casa",
  energia: "Casa",
  agua: "Casa",
  água: "Casa",
  internet: "Casa",
  wifi: "Casa",
  "wi-fi": "Casa",
  gas: "Casa",
  gás: "Casa",
  conta: "Casa",
  casa: "Casa",
  // Lazer / Entretenimento
  entretenimento: "Entretenimento",
  streaming: "Entretenimento",
  netflix: "Entretenimento",
  spotify: "Entretenimento",
  cinema: "Entretenimento",
  bar: "Entretenimento",
  balada: "Entretenimento",
  show: "Entretenimento",
  game: "Entretenimento",
  jogo: "Entretenimento",
  jogos: "Entretenimento",
  steam: "Entretenimento",
  lazer: "Entretenimento",
  // Saúde
  farmacia: "Saúde",
  farmácia: "Saúde",
  remedio: "Saúde",
  remédio: "Saúde",
  saude: "Saúde",
  saúde: "Saúde",
  medico: "Saúde",
  médico: "Saúde",
  academia: "Saúde",
  plano: "Saúde",
  salário: "Salário",
  freelance: "Freelance",
};

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Início da semana (segunda-feira) que contém ref, meia-noite local. */
function startOfWeekMonday(ref: Date): Date {
  const d = startOfLocalDay(ref);
  const dow = d.getDay();
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  d.setDate(d.getDate() - daysFromMonday);
  return startOfLocalDay(d);
}

/** Dia da semana na semana corrente (seg–dom) que contém ref; dow JS 0=dom … 6=sáb. */
function dateForWeekdayInContainingWeek(ref: Date, dowJs: number): Date {
  const monday = startOfWeekMonday(ref);
  const offsetFromMonday = dowJs === 0 ? 6 : dowJs - 1;
  const out = new Date(monday);
  out.setDate(monday.getDate() + offsetFromMonday);
  return startOfLocalDay(out);
}

function weekdayLastWeek(ref: Date, dowJs: number): Date {
  const t = dateForWeekdayInContainingWeek(ref, dowJs);
  t.setDate(t.getDate() - 7);
  return startOfLocalDay(t);
}

function weekdayRetrasada(ref: Date, dowJs: number): Date {
  const t = dateForWeekdayInContainingWeek(ref, dowJs);
  t.setDate(t.getDate() - 14);
  return startOfLocalDay(t);
}

/** Nome ASCII de dia (normalizeForMatch) → getDay() JS. */
const WD_ASCII_TO_JS: Record<string, number> = {
  domingo: 0,
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6,
};

const WD_ORDER_ASCII = [
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
  "domingo",
] as const;

/**
 * Parse natural language date from text. Deterministic, no external APIs.
 * @param refDate data de referência ("hoje"); default `new Date()`.
 */
export function parseNaturalDate(text: string, refDate: Date = new Date()): Date {
  const normalized = normalizeText(text);
  const ascii = normalizeForMatch(normalized);
  const now = refDate;
  const today = startOfLocalDay(now);

  if (ascii.includes("hoje")) return new Date(today);
  if (ascii.includes("ontem")) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return d;
  }
  if (ascii.includes("anteontem")) {
    const d = new Date(today);
    d.setDate(d.getDate() - 2);
    return d;
  }

  // retrasada(o) — duas semanas antes do mesmo dia da semana na semana corrente
  for (const name of WD_ORDER_ASCII) {
    const re = new RegExp(
      `\\b${name}(?:-feira| feira)?\\s+retrasad[ao]\\b`,
      "i"
    );
    if (re.test(ascii)) {
      const dow = WD_ASCII_TO_JS[name] ?? 0;
      return weekdayRetrasada(now, dow);
    }
  }

  // passada(o) — semana anterior
  for (const name of WD_ORDER_ASCII) {
    const re = new RegExp(
      `\\b${name}(?:-feira| feira)?\\s+passad[ao]\\b`,
      "i"
    );
    if (re.test(ascii)) {
      const dow = WD_ASCII_TO_JS[name] ?? 0;
      return weekdayLastWeek(now, dow);
    }
  }

  // dd/mm ou dd-mm (ano opcional)
  const slash = ascii.match(/(?:dia\s+)?(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/);
  if (slash) {
    const day = parseInt(slash[1], 10);
    const month = parseInt(slash[2], 10) - 1;
    const year = slash[3] ? parseInt(slash[3], 10) : now.getFullYear();
    const y = year < 100 ? 2000 + year : year;
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      return new Date(y, month, day);
    }
  }

  // "5 de fevereiro" / "05 de fev" — mês por extenso
  const namedMonth = ascii.match(
    /\b(\d{1,2})\s+de\s+(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/
  );
  if (namedMonth) {
    const day = parseInt(namedMonth[1], 10);
    const mk = normalizeForMatch(namedMonth[2]);
    const month = MONTH_NAME_TO_INDEX[mk];
    if (month != null && day >= 1 && day <= 31) {
      let year = now.getFullYear();
      const cand = new Date(year, month, day);
      if (cand > now) year -= 1;
      return new Date(year, month, day);
    }
  }

  // "em maio" / "no março" — 1º dia do mês (ano ajustado se futuro)
  const monthOnly = extractMonthOnly(ascii);
  if (monthOnly != null && MONTH_NAME_TO_INDEX[monthOnly] != null) {
    const month = MONTH_NAME_TO_INDEX[monthOnly]!;
    let year = now.getFullYear();
    const cand = new Date(year, month, 1);
    if (cand > now) year -= 1;
    return startOfLocalDay(new Date(year, month, 1));
  }

  // "dia 10 de maio"
  const diaDeMes = ascii.match(
    /\bdia\s+(\d{1,2})\s+de\s+(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/
  );
  if (diaDeMes) {
    const day = parseInt(diaDeMes[1], 10);
    const mk = normalizeForMatch(diaDeMes[2]);
    const month = MONTH_NAME_TO_INDEX[mk];
    if (month != null && day >= 1 && day <= 31) {
      let year = now.getFullYear();
      const cand = new Date(year, month, day);
      if (cand > now) year -= 1;
      return startOfLocalDay(new Date(year, month, day));
    }
  }

  // "dia 5" só dia no mês atual (sem mês explícito depois de "dia")
  const diaNumMatch = ascii.match(/dia\s+(\d{1,2})(?:\s|$)/);
  if (diaNumMatch) {
    const day = parseInt(diaNumMatch[1], 10);
    if (day >= 1 && day <= 31) {
      const d = new Date(now.getFullYear(), now.getMonth(), day);
      if (d.getMonth() === now.getMonth()) return startOfLocalDay(d);
    }
  }

  if (/\b(amanha|amanhã)\b/.test(normalized)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }

  // Dia da semana isolado na semana que contém ref
  for (const name of WD_ORDER_ASCII) {
    const re = new RegExp(
      `\\b${name}(?:-feira| feira)?\\b(?!\\s*(passad|retrasad))`,
      "i"
    );
    if (re.test(ascii)) {
      const dow = WD_ASCII_TO_JS[name] ?? 0;
      return dateForWeekdayInContainingWeek(now, dow);
    }
  }

  return new Date(today);
}

/** Indica se o texto traz pista explícita de data (confiança). */
function hasExplicitDate(text: string): boolean {
  return hasExplicitDateHint(text);
}

function resolveShowDateInConfirmation(
  raw: string,
  parsedDate: Date,
  ref: Date
): boolean {
  if (!hasExplicitDateHint(raw)) return false;
  return startOfLocalDay(parsedDate).getTime() !== startOfLocalDay(ref).getTime();
}

const CONFIDENCE_THRESHOLD_SUCCESS = 0.75;
const CONFIDENCE_THRESHOLD_NEEDS_CONFIRMATION = 0.4;

/** Normalize input: lowercase, trim, remove emojis, collapse spaces. */
export function normalizeText(input: string): string {
  const noEmoji = input.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim();
  return noEmoji.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Extract amount from text. Supports:
 * - 45,90 / 45.90
 * - 45 reais / R$ 45 / R$ 45,90
 * Does NOT use numbers that are clearly part of dates (e.g. "dia 5", "05/02").
 * Returns { value, rawFound } for confidence (rawFound = true if we found an explicit number).
 */
/**
 * Parse amount immediately after "R$" (last occurrence in string).
 * Fixes R$1000 → 1000 (regex alternation must not truncate with \\d{1,3} alone).
 */
function parseAmountAfterLastRS(text: string): number | null {
  const lower = text.toLowerCase();
  let lastAt = -1;
  for (let pos = 0; ; ) {
    const i = lower.indexOf("r$", pos);
    if (i === -1) break;
    lastAt = i;
    pos = i + 2;
  }
  if (lastAt === -1) return null;
  let frag = text.slice(lastAt + 2).trimStart();

  const brWithCents = frag.match(/^(\d{1,3}(?:\.\d{3})+,\d{1,2})/);
  if (brWithCents) {
    return parseFloat(brWithCents[1].replace(/\./g, "").replace(",", "."));
  }
  const thousandsNoCents = frag.match(/^(\d{1,3}(?:\.\d{3})+)(?=\s|$|[^\d,.])/);
  if (thousandsNoCents) {
    return parseFloat(thousandsNoCents[1].replace(/\./g, ""));
  }
  const commaDecimal = frag.match(/^(\d+,\d{1,2})\b/);
  if (commaDecimal) {
    return parseFloat(commaDecimal[1].replace(",", "."));
  }
  const plainInt = frag.match(/^(\d+)/);
  if (plainInt) {
    return parseFloat(plainInt[1]);
  }
  return null;
}

export function extractAmount(text: string): { value: number | null; rawFound: boolean } {
  const afterRS = parseAmountAfterLastRS(text);
  if (afterRS != null && Number.isFinite(afterRS)) {
    return { value: afterRS, rawFound: true };
  }

  // "45 reais" / "120 reais" / "45,90 reais" — explicit amount (word boundary)
  const reaisMatch = text.match(/(\d+(?:[.,]\d{1,2})?)\s+reais?\b/gi);
  if (reaisMatch) {
    const last = reaisMatch[reaisMatch.length - 1];
    const num = last.replace(/\s+reais?\b/gi, "").trim().replace(/\./g, "").replace(",", ".");
    const value = parseFloat(num);
    if (Number.isFinite(value)) return { value, rawFound: true };
  }

  // US-style decimal: 45.90 (dot) — before generic number extraction
  const usDecimalMatch = text.match(/\b(\d+\.\d{1,2})\b/g);
  if (usDecimalMatch) {
    const last = usDecimalMatch[usDecimalMatch.length - 1];
    const value = parseFloat(last);
    if (Number.isFinite(value)) return { value, rawFound: true };
  }

  // Brazilian style: integer (3500) or 45,90 or 1.234,56 — prefer full integer first
  const brNum = /(\d+(?:,\d{1,2})?|\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d{1,3}(?:\.\d{3})*,\d{1,2})/gi;
  let match: RegExpExecArray | null;
  const candidates: { value: number; isDateContext: boolean }[] = [];
  while ((match = brNum.exec(text)) !== null) {
    const numStr = match[1].replace(/\./g, "").replace(",", ".");
    const value = parseFloat(numStr);
    if (!Number.isFinite(value)) continue;
    const before = text.slice(0, match.index);
    const isDateContext =
      /dia\s+\d{1,2}\s*$/.test(before) ||
      /\d{1,2}\/\d{1,2}\s*$/.test(before) ||
      /dia\s+$/.test(before);
    candidates.push({ value, isDateContext });
  }
  const amountLike = candidates.filter((c) => !c.isDateContext && (c.value > 9 || text.includes(",")));
  if (amountLike.length > 0) {
    const best = amountLike[amountLike.length - 1];
    return { value: best.value, rawFound: true };
  }
  const anyNonDate = candidates.find((c) => !c.isDateContext);
  if (anyNonDate) return { value: anyNonDate.value, rawFound: true };

  // US style: 45.90 (dot decimal) — clear amount
  const usNum = /(\d+(?:\.\d{1,2})?)\s*(?:reais?|r\$)?/gi;
  const usMatch = text.match(usNum);
  if (usMatch) {
    const filtered = usMatch.filter((m) => {
      const idx = text.indexOf(m);
      const before = text.slice(0, idx);
      return !/dia\s+\d*\s*$/.test(before) && !/\d{1,2}\/\d{1,2}\s*$/.test(before);
    });
    if (filtered.length > 0) {
      const last = filtered[filtered.length - 1];
      const num = last.replace(/\s*(?:reais?|r\$)/gi, "").trim();
      const value = parseFloat(num);
      if (Number.isFinite(value)) return { value, rawFound: true };
    }
  }

  return { value: null, rawFound: false };
}

/** Detect income vs expense from keywords. Returns type or null if unclear. */
function detectType(text: string): "income" | "expense" | null {
  const hasIncome = INCOME_KEYWORDS.some((k) => text.includes(k));
  const hasExpense = EXPENSE_KEYWORDS.some((k) => text.includes(k));
  if (hasIncome && !hasExpense) return "income";
  if (hasExpense && !hasIncome) return "expense";
  if (hasIncome && hasExpense) return null;
  return null;
}

const FUZZY_THRESHOLD = 0.6;

/**
 * Suggest category from text: keyword map (accent + case insensitive) then fuzzy match.
 * Only returns categories present in userCategories. O(n).
 */
export function suggestCategory(
  text: string,
  userCategories: string[]
): string | null {
  const inputNorm = normalizeForMatch(text);
  const userSet = new Set(
    userCategories.map((c) => normalizeForMatch(c))
  );
  const userByNorm = new Map<string, string>(
    userCategories.map((c) => [normalizeForMatch(c), c])
  );

  let matchedKeyword: string | null = null;
  let matchedCategory: string | null = null;

  const keywordEntries = Object.entries(KEYWORD_TO_CATEGORY).sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [keyword, category] of keywordEntries) {
    const kwNorm = normalizeForMatch(keyword);
    if (!kwNorm || kwNorm.length < 2) continue;
    if (inputNorm.includes(kwNorm) && userSet.has(normalizeForMatch(category))) {
      matchedKeyword = keyword;
      matchedCategory = userByNorm.get(normalizeForMatch(category)) ?? category;
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.debug("[Nyx] category detection", {
          input: text.slice(0, 80),
          matchedKeyword,
          matchedCategory,
          fallback: false,
        });
      }
      return matchedCategory;
    }
  }

  for (const cat of userCategories) {
    const catNorm = normalizeForMatch(cat);
    if (catNorm.length < 2) continue;
    if (inputNorm.includes(catNorm) || catNorm.includes(inputNorm)) {
      matchedCategory = cat;
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.debug("[Nyx] category detection", {
          input: text.slice(0, 80),
          matchedKeyword: null,
          matchedCategory,
          fallback: false,
        });
      }
      return cat;
    }
  }

  for (const cat of userCategories) {
    const catNorm = normalizeForMatch(cat);
    const sim = diceBigramSimilarity(inputNorm, catNorm);
    if (sim >= FUZZY_THRESHOLD) {
      matchedCategory = cat;
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.debug("[Nyx] category detection", {
          input: text.slice(0, 80),
          matchedKeyword: null,
          matchedCategory,
          fallback: false,
        });
      }
      return cat;
    }
  }

  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.debug("[Nyx] category detection", {
      input: text.slice(0, 80),
      matchedKeyword: null,
      matchedCategory: null,
      fallback: true,
    });
  }
  return null;
}

function hasWeekdayRelativeMention(ascii: string): boolean {
  return /\b(domingo|segunda|terca|quarta|quinta|sexta|sabado)(?:-feira|\s+feira)?\b/.test(
    ascii
  );
}

function dateNeedsExplicitConfirmation(
  normalized: string,
  ascii: string,
  parsedDate: Date,
  ref: Date
): boolean {
  if (extractRecurringMonthlyDay(ascii) != null) return false;
  if (parseInstallmentContext(normalized).kind !== "none") return false;
  if (/\b(amanha|amanhã)\b/.test(normalized)) return true;
  const startParsed = startOfLocalDay(parsedDate).getTime();
  const startRef = startOfLocalDay(ref).getTime();
  if (startParsed <= startRef) return false;
  if (hasWeekdayRelativeMention(ascii)) return false;
  return true;
}

/**
 * Compute confidence 0–1. Reductions:
 * −0.3 amount uncertain, −0.3 type uncertain, −0.15 category null, −0.1 date guessed.
 * (Category penalty 0.15 so that "recebi 3500 de salário" reaches ≥ 0.75.)
 */
function computeConfidence(
  amountCertain: boolean,
  typeCertain: boolean,
  categorySuggested: string | null,
  dateExplicit: boolean
): number {
  let c = 1.0;
  if (!amountCertain) c -= 0.3;
  if (!typeCertain) c -= 0.3;
  if (categorySuggested == null) c -= 0.15;
  if (!dateExplicit) c -= 0.1;
  return Math.max(0, Math.min(1, c));
}

/**
 * Main parser: normalize → amount → type → date → category → confidence → result.
 * NEVER guesses amount; NEVER invents category; deterministic.
 */
export async function parseTransactionInput(
  input: string,
  userCategories: string[],
  options?: ParseTransactionOptions
): Promise<ParseResult> {
  const raw = input.trim();
  if (!raw) {
    return { status: "error", reason: "Entrada vazia." };
  }

  const ref = options?.refDate ?? new Date();
  const normalized = normalizeText(raw);
  const ascii = normalizeForMatch(normalized);
  const instCtx = parseInstallmentContext(raw);

  /** Só contagem de parcelas — pergunta o valor da parcela. */
  if (instCtx.kind === "need_amount") {
    if (detectType(normalized) === "income") {
      return {
        status: "error",
        reason: "Parcelamento é para despesas. Reformula como gasto (ex.: parcelei X em Nx).",
      };
    }
    const resolvedType: "income" | "expense" = "expense";
    const date = parseNaturalDate(normalized, ref);
    let dateExplicit = hasExplicitDate(normalized);
    const categorySuggested = suggestCategory(normalized, userCategories);
    const description = extractSemanticDescription(raw, normalized, resolvedType);
    const data: ParsedTransaction = {
      description,
      amount: 0,
      type: resolvedType,
      categorySuggested,
      date,
      confidence: 0.88,
      pendingInstallmentCount: instCtx.count,
      pendingInstallmentFirstDueDay: instCtx.firstDueDay,
      _nyxAwaiting: "installment_amount",
      showDateInConfirmation: resolveShowDateInConfirmation(raw, date, ref),
    };
    const dateAmbiguous = dateNeedsExplicitConfirmation(normalized, ascii, data.date, ref);
    if (dateAmbiguous) data.confidence = Math.min(data.confidence, 0.72);
    const missing: string[] = [];
    if (categorySuggested == null) missing.push("categoria");
    if (!dateExplicit) missing.push("data");
    if (dateAmbiguous) missing.push("data (confirmar data futura)");
    if (data.confidence >= CONFIDENCE_THRESHOLD_SUCCESS) {
      return { status: "success", data };
    }
    if (data.confidence >= CONFIDENCE_THRESHOLD_NEEDS_CONFIRMATION) {
      return { status: "needs_confirmation", data, missing };
    }
    return {
      status: "error",
      reason: "Não foi possível interpretar com segurança. Confirme tipo, valor e data.",
    };
  }

  const { value: amountValue, rawFound: amountFound } = extractAmount(normalized);

  if (amountValue == null || !amountFound) {
    return { status: "error", reason: "Valor não encontrado. Informe o valor da transação." };
  }

  let type = detectType(normalized);
  if (type === null && (instCtx.kind === "full" || instCtx.kind === "need_count")) {
    type = "expense";
  }
  const typeCertain = type !== null;
  const resolvedType: "income" | "expense" = type ?? "expense";

  if (instCtx.kind === "full" && resolvedType === "income") {
    return {
      status: "error",
      reason: "Parcelamento não se aplica a receitas. Reformula como despesa.",
    };
  }

  /** Só o valor da parcela — pergunta em quantas vezes. */
  if (instCtx.kind === "need_count" && resolvedType === "expense") {
    const each = instCtx.amountEach;
    const date = parseNaturalDate(normalized, ref);
    let dateExplicit = hasExplicitDate(normalized);
    const categorySuggested = suggestCategory(normalized, userCategories);
    const description = extractSemanticDescription(raw, normalized, "expense");
    const data: ParsedTransaction = {
      description,
      amount: -Math.abs(each),
      type: "expense",
      categorySuggested,
      date,
      confidence: 0.88,
      pendingInstallmentAmountEach: each,
      pendingInstallmentFirstDueDay: instCtx.firstDueDay,
      _nyxAwaiting: "installment_count",
      showDateInConfirmation: resolveShowDateInConfirmation(raw, date, ref),
    };
    const dateAmbiguous = dateNeedsExplicitConfirmation(normalized, ascii, data.date, ref);
    if (dateAmbiguous) data.confidence = Math.min(data.confidence, 0.72);
    const missing: string[] = [];
    if (categorySuggested == null) missing.push("categoria");
    if (!dateExplicit) missing.push("data");
    if (dateAmbiguous) missing.push("data (confirmar data futura)");
    if (data.confidence >= CONFIDENCE_THRESHOLD_SUCCESS) {
      return { status: "success", data };
    }
    if (data.confidence >= CONFIDENCE_THRESHOLD_NEEDS_CONFIRMATION) {
      return { status: "needs_confirmation", data, missing };
    }
    return {
      status: "error",
      reason: "Não foi possível interpretar com segurança. Confirme tipo, valor e data.",
    };
  }

  const date = parseNaturalDate(normalized, ref);
  let dateExplicit = hasExplicitDate(normalized);

  const categorySuggested = suggestCategory(normalized, userCategories);

  let amount =
    resolvedType === "income"
      ? Math.abs(amountValue)
      : -Math.abs(amountValue);

  const description = extractSemanticDescription(raw, normalized, resolvedType);

  const data: ParsedTransaction = {
    description,
    amount,
    type: resolvedType,
    categorySuggested,
    date,
    confidence: 0,
  };

  if (instCtx.kind === "full" && resolvedType === "expense") {
    const firstDue =
      instCtx.firstDueDay != null
        ? nextCalendarDateForDayOfMonth(instCtx.firstDueDay, ref)
        : undefined;
    data.installmentPlan = {
      count: instCtx.count,
      amountEach: instCtx.amountEach,
      ...(firstDue ? { firstDueDate: firstDue } : {}),
    };
    data.amount = -Math.abs(instCtx.amountEach);
    if (firstDue) {
      data.date = firstDue;
      data.installmentAwaitingFirstDue = false;
    } else {
      data.installmentAwaitingFirstDue = true;
      data._nyxAwaiting = "installment_first_due";
      data.date = startOfLocalDay(ref);
    }
    dateExplicit = dateExplicit || instCtx.firstDueDay != null;
  } else {
    const recD = extractRecurringMonthlyDay(ascii);
    if (recD != null && resolvedType === "expense" && !userDeclaresOneShotOnly(ascii)) {
      data.recurringBill = { frequency: "monthly", dayOfMonth: recD };
      data.date = nextCalendarDateForDayOfMonth(recD, ref);
      data._nyxAwaiting = "recurring_choice";
      dateExplicit = true;
    }
  }

  const dateAmbiguous = dateNeedsExplicitConfirmation(
    normalized,
    ascii,
    data.date,
    ref
  );

  let confidence = computeConfidence(
    amountFound,
    typeCertain,
    categorySuggested,
    dateExplicit
  );
  if (dateAmbiguous) {
    confidence = Math.min(confidence, 0.72);
  }
  if (data._nyxAwaiting) {
    confidence = Math.max(confidence, 0.82);
  }

  data.confidence = confidence;
  data.showDateInConfirmation = resolveShowDateInConfirmation(raw, data.date, ref);

  const missing: string[] = [];
  if (!typeCertain) missing.push("tipo (receita ou despesa)");
  if (categorySuggested == null) missing.push("categoria");
  if (!dateExplicit) missing.push("data");
  if (dateAmbiguous) missing.push("data (confirmar data futura)");

  if (confidence >= CONFIDENCE_THRESHOLD_SUCCESS) {
    return { status: "success", data };
  }
  if (confidence >= CONFIDENCE_THRESHOLD_NEEDS_CONFIRMATION) {
    return { status: "needs_confirmation", data, missing };
  }
  return { status: "error", reason: "Não foi possível interpretar com segurança. Confirme tipo, valor e data." };
}

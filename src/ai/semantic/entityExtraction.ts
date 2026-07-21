import { normalizeForMatch, normalizeToken } from "./normalizeText";
import type { EntityCandidate } from "./types";

const DISPLAY_FORMS: Record<string, string> = {
  cafe: "Café",
  cafeteria: "Café",
  hamburguer: "Hambúrguer",
  macarrao: "Macarrão",
  macarrão: "Macarrão",
  japones: "Japonês",
  japonesa: "Japonês",
  uber: "Uber",
  ifood: "iFood",
  netflix: "Netflix",
  spotify: "Spotify",
  steam: "Steam",
  atacadao: "Atacadão",
  atacadão: "Atacadão",
  salario: "Salário",
  salário: "Salário",
  mercado: "Mercado",
};

const BRAND_TOKENS = new Set([
  "uber",
  "ifood",
  "99",
  "netflix",
  "spotify",
  "steam",
  "nubank",
  "pix",
  "amazon",
  "shopee",
  "mercadolivre",
]);

const FOOD_TOKENS = new Set([
  "cafe",
  "cafeteria",
  "pizza",
  "pizzaria",
  "hamburguer",
  "macarrao",
  "sushi",
  "japones",
  "japonesa",
  "padaria",
  "lanche",
  "almoco",
  "jantar",
]);

const FINANCIAL_VERBS = new Set([
  "gastei",
  "paguei",
  "comprei",
  "recebi",
  "ganhei",
  "transferi",
  "depositei",
  "saquei",
  "pago",
  "gasto",
  "acabei",
  "pagamento",
  "parcelei",
]);

const TEMPORAL_TOKENS = new Set([
  ...["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
  "ontem",
  "hoje",
  "anteontem",
  "amanha",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
  "domingo",
  "feira",
  "passada",
  "passado",
  "retrasada",
  "retrasado",
  "dia",
]);

const STOPWORDS = new Set([
  ...FINANCIAL_VERBS,
  ...TEMPORAL_TOKENS,
  "no",
  "na",
  "nos",
  "nas",
  "com",
  "para",
  "pro",
  "pra",
  "por",
  "pelo",
  "pela",
  "da",
  "do",
  "das",
  "dos",
  "de",
  "em",
  "um",
  "uma",
  "uns",
  "umas",
  "o",
  "a",
  "os",
  "as",
  "ao",
  "reais",
  "real",
  "r$",
  "vezes",
  "vez",
  "parcela",
  "parcelas",
  "parcelado",
  "parcelada",
  "financiei",
  "mercado",
  "supermercado",
  "ifood",
]);

function stripAmounts(s: string): string {
  let t = s;
  t = t.replace(/\br\$\s*/gi, " ");
  t = t.replace(/\b\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?\b/g, " ");
  t = t.replace(/\b\d+(?:,\d{1,2})?\s+reais?\b/gi, " ");
  t = t.replace(/\b\d+(?:[.,]\d{1,2})?\b/g, " ");
  return t.replace(/\s+/g, " ").trim();
}

function stripInstallmentPhrases(s: string): string {
  let t = s;
  t = t.replace(/\bem\s+\d{1,3}\s*(?:parcelas?|x|vezes)\b/gi, " ");
  t = t.replace(/\b\d{1,3}\s*(?:parcelas?|vezes)\s+de\b/gi, " ");
  t = t.replace(/\b\d{1,3}\s*x\s*(?:de\s*)?\b/gi, " ");
  t = t.replace(/\bx\s*\d{1,3}\b/gi, " ");
  t = t.replace(/\bacabei\s+de\s+(?:pagar|comprar|gastar)\b/gi, " ");
  return t.replace(/\s+/g, " ").trim();
}

function titleCaseWord(w: string): string {
  const core = w.trim();
  if (!core) return core;
  const norm = normalizeToken(core);
  const mapped = DISPLAY_FORMS[norm] ?? DISPLAY_FORMS[core.toLowerCase()];
  if (mapped) return mapped;
  const first = core[0]!.toUpperCase();
  return first + core.slice(1).toLowerCase();
}

/** Padrões compostos antes da tokenização. */
function extractPatternEntities(ascii: string): EntityCandidate[] {
  const out: EntityCandidate[] = [];

  const ifoodDo = ascii.match(/\bifood\s+do\s+([a-z]+)\b/);
  if (ifoodDo?.[1] && !STOPWORDS.has(ifoodDo[1])) {
    out.push({
      text: ifoodDo[1],
      normalized: normalizeToken(ifoodDo[1]),
      score: 95,
      kind: "food",
    });
  }

  const ifoodDe = ascii.match(/\bifood\s+(?:de\s+)?([a-z]+)\b/);
  if (ifoodDe?.[1] && ifoodDe[1] !== "do" && !STOPWORDS.has(ifoodDe[1])) {
    out.push({
      text: ifoodDe[1],
      normalized: normalizeToken(ifoodDe[1]),
      score: 88,
      kind: "food",
    });
  }

  const mercadoNome = ascii.match(/\bmercado\s+([a-z]+)\b/);
  if (mercadoNome?.[1] && mercadoNome[1] !== "atacadao" && !STOPWORDS.has(mercadoNome[1])) {
    out.push({
      text: mercadoNome[1],
      normalized: normalizeToken(mercadoNome[1]),
      score: 90,
      kind: "place",
    });
  }

  const noMercado = ascii.match(/\bno\s+mercado\b/);
  if (noMercado) {
    out.push({
      text: "mercado",
      normalized: "mercado",
      score: 75,
      kind: "place",
    });
  }

  return out;
}

export function extractEntities(
  remainder: string,
  transactionType: "income" | "expense"
): EntityCandidate[] {
  if (transactionType === "income" && /\b(salario|salário)\b/i.test(remainder)) {
    return [{ text: "salário", normalized: "salario", score: 100, kind: "generic" }];
  }

  const ascii = normalizeForMatch(remainder);
  const patternHits = extractPatternEntities(ascii);

  let working = stripInstallmentPhrases(ascii);
  working = stripAmounts(working);
  working = working.replace(/\s+/g, " ").trim();

  const tokens = working
    .split(/\s+/)
    .map((t) => t.replace(/^[^a-z0-9áéíóúâêîôûãõç-]+/i, "").replace(/[^a-z0-9áéíóúâêîôûãõç-]+$/i, ""))
    .filter((t) => t.length > 0);

  const candidates: EntityCandidate[] = [...patternHits];

  for (const token of tokens) {
    const norm = normalizeToken(token);
    if (!norm || norm.length < 2) continue;
    if (STOPWORDS.has(norm)) continue;
    if (TEMPORAL_TOKENS.has(norm)) continue;
    if (/^\d+$/.test(norm)) continue;

    let score = 40;
    let kind: EntityCandidate["kind"] = "generic";

    if (BRAND_TOKENS.has(norm)) {
      score = 92;
      kind = "brand";
    } else if (FOOD_TOKENS.has(norm)) {
      score = 85;
      kind = "food";
    } else if (norm === "atacadao") {
      score = 88;
      kind = "place";
    } else if (token.length >= 4) {
      score = 55;
      kind = "product";
    }

    if (norm === "atacadao" && ascii.includes("mercado")) {
      score = 94;
      kind = "place";
    }

    candidates.push({ text: token, normalized: norm, score, kind });
  }

  return candidates;
}

export function formatEntityLabel(candidate: EntityCandidate): string {
  return titleCaseWord(
    DISPLAY_FORMS[candidate.normalized] ? candidate.normalized : candidate.text
  );
}

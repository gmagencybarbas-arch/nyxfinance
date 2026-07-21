/**
 * Humanização das respostas da Nyx.
 * Tom: elegante, levemente provocativo, curto, PT-BR natural.
 */

const SUCCESS_PHRASES = [
  "Pronto… já registrei pra você. ✅",
  "Perfeito… já deixei tudo organizado por aqui.",
  "Anotado. Já está na sua conta.",
  "Feito. Tudo certinho.",
];

const ERROR_ASK_AMOUNT = [
  "Hmm… não consegui identificar o valor. Quanto foi?",
  "Pode me dizer o valor dessa transação?",
  "Quanto foi? Não deu pra entender.",
];

const CONFIRMATION_INTRO_EXPENSE = "Entendi… gasto de";
const CONFIRMATION_INTRO_INCOME = "Você recebeu";
const CONFIRMATION_ASK_EXPENSE = "Confirma?";
const CONFIRMATION_ASK_INCOME = "Posso registrar?";

const _counters = { success: 0, errorAmount: 0 };

function pickRotating<T>(arr: T[], key: keyof typeof _counters): T {
  const i = _counters[key] % arr.length;
  _counters[key] += 1;
  return arr[i]!;
}

/** Mensagem de sucesso após confirmar transação. */
export function getNyxSuccessMessage(): string {
  return pickRotating(SUCCESS_PHRASES, "success");
}

/** Mensagem quando o valor não foi identificado (rotação). */
export function getNyxErrorMessage(): string {
  return pickRotating(ERROR_ASK_AMOUNT, "errorAmount");
}

/** Início da frase de confirmação (gasto vs entrada). */
export function getNyxConfirmationIntro(type: "income" | "expense"): string {
  return type === "expense" ? CONFIRMATION_INTRO_EXPENSE : CONFIRMATION_INTRO_INCOME;
}

/** Pergunta final de confirmação. */
export function getNyxConfirmationAsk(type: "income" | "expense"): string {
  return type === "expense" ? CONFIRMATION_ASK_EXPENSE : CONFIRMATION_ASK_INCOME;
}

const OPTIONAL_DESC_PROMPT =
  "Quer acrescentar uma descrição ou observação a esse lançamento?";

/** Mensagem após o usuário escolher incluir descrição (digitação no chat). */
export function getOptionalDescriptionTypeHint(): string {
  return "Okay, pode digitar os detalhes/observação do lançamento!";
}

export function getOptionalDescriptionPrompt(): string {
  return OPTIONAL_DESC_PROMPT;
}

export function getInstallmentCommitmentPrompt(): string {
  return "Quer que eu acompanhe isso nos seus compromissos mensais?";
}

export function getNyxInstallmentAmountQuestion(): string {
  return "Qual o valor de cada parcela?";
}

export function getNyxInstallmentCountQuestion(): string {
  return "Em quantas parcelas ficou?";
}

/** Primeiro nome para tom pessoal no chat. */
export function nyxUserFirstName(displayName?: string | null): string | null {
  const trimmed = displayName?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? null;
}

/** Pergunta da 1ª parcela (após inferir quantidade e valor). */
export function buildInstallmentFirstDueQuestion(opts: {
  count: number;
  eachFormatted: string;
  description: string;
  userDisplayName?: string | null;
}): string {
  const desc =
    opts.description && opts.description !== "Transação" ? opts.description : "esse item";
  const first = nyxUserFirstName(opts.userDisplayName);
  const vocativo = first ? `, ${first}` : "";

  return [
    "Entendi…",
    `**${opts.count} parcelas** de **${opts.eachFormatted}** · **${desc}**`,
    "",
    `Só pra confirmar${vocativo} — quando vem a **primeira parcela**?`,
  ].join("\n");
}

/** Resumo antes de confirmar parcelamento completo. */
export function buildInstallmentConfirmSummary(opts: {
  count: number;
  eachFormatted: string;
  description: string;
  firstDueFormatted: string;
}): string {
  const desc =
    opts.description && opts.description !== "Transação" ? opts.description : "Lançamento";

  return [
    "Resumo:",
    `**${opts.count}x** de **${opts.eachFormatted}** · **${desc}**`,
    `**1ª parcela** é no dia **${opts.firstDueFormatted}**`,
    "",
    "Tudo certo pra eu registrar o **parcelamento**?",
  ].join("\n");
}

/** Confirmação de despesa/receita simples (não parcelado). */
export function buildSimpleTransactionConfirm(opts: {
  type: "income" | "expense";
  amountFormatted: string;
  description: string;
  dateSuffix?: string;
}): string {
  const desc =
    opts.description && opts.description !== "Transação" ? opts.description : "transação";
  const datePart = opts.dateSuffix ?? "";

  if (opts.type === "expense") {
    return `Entendi… gasto de **${opts.amountFormatted}** com **${desc}**${datePart}. **Confirma?**`;
  }
  return `Entendi… você recebeu **${opts.amountFormatted}**${datePart}. **Posso registrar?**`;
}

/** Conta recorrente — escolha sim/não. */
export function buildRecurringChoiceMessage(opts: {
  description: string;
  amountFormatted: string;
  dayOfMonth: number;
  nextDueFormatted: string;
}): string {
  const desc =
    opts.description && opts.description !== "Transação" ? opts.description : "esse pagamento";

  return [
    `Entendi — **${desc}**, **${opts.amountFormatted}**, todo dia **${opts.dayOfMonth}** do mês.`,
    `Próximo vencimento: **${opts.nextDueFormatted}**.`,
    "",
    "Quer que eu transforme em **compromisso recorrente**? Responde **sim** ou **não**.",
  ].join("\n");
}

/** Resumo de recorrente aceito. */
export function buildRecurringConfirmSummary(opts: {
  description: string;
  amountFormatted: string;
  dayOfMonth: number;
  nextDueFormatted: string;
  asCommitment: boolean;
}): string {
  const desc =
    opts.description && opts.description !== "Transação" ? opts.description : "Lançamento";
  const tag = opts.asCommitment ? " · **compromisso recorrente**" : "";

  return [
    "Resumo:",
    `**${desc}** · **${opts.amountFormatted}**`,
    `Todo dia **${opts.dayOfMonth}** (próximo **${opts.nextDueFormatted}**)${tag}`,
    "",
    "**Confirma?**",
  ].join("\n");
}

type SummaryParsed = {
  amount: number;
  type: "income" | "expense";
  date: Date;
  description: string;
  categorySuggested: string | null;
};

/** Bloco de resumo pós-lançamento (chat, sem JSON). */
export function formatTransactionSummaryCard(p: SummaryParsed): string {
  const amountStr = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Math.abs(p.amount));
  const d = p.date;
  const dateStr = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
  const title =
    p.description && p.description !== "Transação" ? p.description : "Lançamento";
  const cat = p.categorySuggested?.trim() || "Outros";
  const kind = p.type === "income" ? "Receita" : "Despesa";
  return [
    "✓ Registrado",
    "",
    `${amountStr}  ·  ${dateStr}`,
    title,
    `${cat}  ·  ${kind}`,
  ].join("\n");
}

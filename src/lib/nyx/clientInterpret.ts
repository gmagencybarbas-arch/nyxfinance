import type {
  NyxInterpretation,
  NyxPendingBatch,
  NyxInterpretRequest,
} from "./types";

const INTERPRET_TIMEOUT_MS = 25_000;

/**
 * Função única no cliente: texto digitado OU transcrição de áudio.
 * Timeout evita travar o chat se a API não responder.
 */
export async function interpretNyxMessage(
  text: string,
  pendingBatch: NyxPendingBatch | null,
  extras?: Partial<
    Pick<
      NyxInterpretRequest,
      | "currentDate"
      | "timezone"
      | "userCategories"
      | "source"
      | "transcript"
      | "recordedAt"
      | "locale"
    >
  >
): Promise<NyxInterpretation> {
  const timezone =
    extras?.timezone ??
    (typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "America/Sao_Paulo");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), INTERPRET_TIMEOUT_MS);

  try {
    const res = await fetch("/api/nyx/interpret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        message: text,
        currentDate: extras?.currentDate ?? new Date().toISOString(),
        timezone,
        userCategories: extras?.userCategories ?? [],
        pendingBatch,
        source: extras?.source ?? "text",
        transcript: extras?.transcript,
        recordedAt: extras?.recordedAt,
        locale: extras?.locale ?? "pt-BR",
      } satisfies NyxInterpretRequest),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? `Falha ao interpretar (${res.status})`);
    }

    return (await res.json()) as NyxInterpretation;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("Demorou demais pra interpretar. Tenta de novo?");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

const CONFIRM_ALL =
  /^(sim|confirma|confirmar|pode lançar|pode lancar|está certo|esta certo|tudo certo|manda|registra|beleza|ok|isso|confirmo)[\s!.]*$/i;
const CANCEL_ALL =
  /^(não|nao|cancela|cancelar|esquece|deixa pra lá|deixa pra la|apaga tudo|descarta)[\s!.]*$/i;

export function isLocalConfirmAll(message: string): boolean {
  return CONFIRM_ALL.test(message.trim());
}

export function isLocalCancelAll(message: string): boolean {
  return CANCEL_ALL.test(message.trim());
}

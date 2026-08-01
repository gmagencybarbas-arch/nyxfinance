/**
 * Ponte pura áudio → interpret (testável, sem UI).
 * O transcript segue integral para o mesmo pipeline do texto.
 */

export type AudioInterpretMeta = {
  source: "audio";
  transcript: string;
  recordedAt: string;
  locale: string;
};

/** Rejeita transcript vazio antes de handleSend / interpret. */
export function validateTranscriptForSend(transcript: string): string {
  const trimmed = transcript.replace(/\u0000/g, "").trim();
  if (!trimmed) {
    throw new Error("Não consegui entender o áudio. Tenta de novo?");
  }
  return trimmed;
}

/** Metadados de origem — não alteram a semântica no servidor. */
export function buildAudioInterpretMeta(
  transcript: string,
  opts?: { recordedAt?: string; locale?: string }
): AudioInterpretMeta {
  const clean = validateTranscriptForSend(transcript);
  return {
    source: "audio",
    transcript: clean,
    recordedAt: opts?.recordedAt ?? new Date().toISOString(),
    locale: opts?.locale ?? "pt-BR",
  };
}

/**
 * Payload enviado à OpenAI em interpretNyxMessage.
 * source/transcript/recordedAt NÃO entram aqui — só metadado de transporte.
 */
export function buildInterpretUserPayload(input: {
  message: string;
  currentDate: string;
  timezone: string;
  userCategories: string[];
  pendingBatch: unknown;
  source?: string;
  transcript?: string;
  recordedAt?: string;
  locale?: string;
}) {
  return {
    message: input.message,
    currentDate: input.currentDate,
    timezone: input.timezone,
    userCategories: input.userCategories,
    pendingBatch: input.pendingBatch,
  };
}

/** Áudio não deve cair no parser local do cliente se a API falhar. */
export function shouldSkipLocalParserFallback(source?: string | null): boolean {
  return source === "audio";
}

/** Constantes e validação compartilhadas (cliente + servidor) para áudio → transcrição. */

export const AUDIO_TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe" as const;

export const AUDIO_TRANSCRIBE_PROMPT =
  "Esta é uma mensagem em português do Brasil para uma assistente financeira chamada Nyx. Preserve valores monetários, datas, nomes de estabelecimentos, categorias, números de parcelas, expressões como hoje, ontem, amanhã, mês que vem, primeira parcela, despesa fixa, receita e salário. Não resuma e não reorganize o conteúdo.";

/** Limite de upload (bytes). Whisper aceita até 25MB; usamos margem conservadora. */
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

/** Gravação mínima / máxima no cliente (ms). */
export const MIN_RECORDING_MS = 400;
export const MAX_RECORDING_MS = 60_000;

/** Blob vazio / ruído. */
export const MIN_AUDIO_BYTES = 512;

const ALLOWED_MIME_PREFIXES = [
  "audio/webm",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp3",
  "audio/aac",
  "audio/x-caf",
] as const;

export function normalizeAudioMime(raw: string | null | undefined): string {
  const base = (raw ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (base === "audio/x-m4a" || base === "audio/m4a") return "audio/mp4";
  if (base === "audio/wave" || base === "audio/x-wav") return "audio/wav";
  if (base === "audio/mp3") return "audio/mpeg";
  return base;
}

export function isAllowedAudioMime(mime: string): boolean {
  const n = normalizeAudioMime(mime);
  if (!n.startsWith("audio/")) return false;
  return ALLOWED_MIME_PREFIXES.some((p) => n === p || n.startsWith(p));
}

export function extensionForAudioMime(mime: string): string {
  const n = normalizeAudioMime(mime);
  if (n.includes("webm")) return ".webm";
  if (n.includes("ogg")) return ".ogg";
  if (n.includes("wav")) return ".wav";
  if (n.includes("mpeg") || n.includes("mp3")) return ".mp3";
  if (n.includes("aac")) return ".aac";
  if (n.includes("mp4") || n.includes("m4a") || n.includes("caf")) return ".m4a";
  return ".webm";
}

export function pickRecorderMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/mp4",
    "audio/mp4;codecs=mp4a.40.2",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
  ];
  for (const c of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(c)) return c;
    } catch {
      /* ignore */
    }
  }
  return "";
}

export type VoiceUiPhase =
  | "idle"
  | "requesting_permission"
  | "recording"
  | "uploading"
  | "transcribing"
  | "interpreting"
  | "ready_for_confirmation"
  | "error";

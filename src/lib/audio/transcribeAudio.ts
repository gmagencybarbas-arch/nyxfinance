import OpenAI from "openai";
import { hasOpenAIKey } from "@/lib/openai/client";
import {
  AUDIO_TRANSCRIBE_MODEL,
  AUDIO_TRANSCRIBE_PROMPT,
  extensionForAudioMime,
  normalizeAudioMime,
} from "./constants";

export type TranscribeAudioInput = {
  buffer: Buffer;
  mimeType: string;
  /** Nome lógico (sem path). */
  filename?: string;
};

export type TranscribeAudioResult = {
  transcript: string;
  model: string;
};

/**
 * Transcreve áudio no servidor via OpenAI.
 * Não interpreta financeiro e não persiste o arquivo.
 * Timeout maior que o client de chat (áudio pode demorar mais).
 */
export async function transcribeAudioBuffer(
  input: TranscribeAudioInput
): Promise<TranscribeAudioResult> {
  if (!hasOpenAIKey()) {
    throw new Error("Transcrição indisponível no momento.");
  }

  const key = process.env.OPENAI_API_KEY!.trim();
  const mime = normalizeAudioMime(input.mimeType) || "audio/webm";
  const ext = extensionForAudioMime(mime);
  const filename = input.filename?.replace(/[^\w.\-]+/g, "_") || `voice${ext}`;

  const { toFile } = await import("openai");
  const file = await toFile(input.buffer, filename.endsWith(ext) ? filename : `${filename}${ext}`, {
    type: mime,
  });

  const openai = new OpenAI({
    apiKey: key,
    timeout: 60_000,
    maxRetries: 1,
  });

  const result = await openai.audio.transcriptions.create({
    file,
    model: AUDIO_TRANSCRIBE_MODEL,
    language: "pt",
    prompt: AUDIO_TRANSCRIBE_PROMPT,
    response_format: "text",
  });

  const transcript =
    typeof result === "string"
      ? result
      : typeof (result as { text?: string }).text === "string"
        ? (result as { text: string }).text
        : String(result ?? "");

  const cleaned = transcript.replace(/\u0000/g, "").trim();
  if (!cleaned) {
    throw new Error("Não consegui entender o áudio. Tenta de novo?");
  }

  return { transcript: cleaned, model: AUDIO_TRANSCRIBE_MODEL };
}

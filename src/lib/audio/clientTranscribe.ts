import {
  isAllowedAudioMime,
  MAX_AUDIO_BYTES,
  MIN_AUDIO_BYTES,
  normalizeAudioMime,
  extensionForAudioMime,
} from "./constants";

const TRANSCRIBE_TIMEOUT_MS = 55_000;

export type TranscribeClientResult = {
  transcript: string;
  locale: string;
};

/**
 * Envia o blob gravado para POST /api/audio/transcribe.
 * A chave OpenAI nunca sai do servidor.
 */
export async function transcribeAudioBlob(
  blob: Blob,
  opts?: { mimeType?: string; recordedAt?: string }
): Promise<TranscribeClientResult> {
  const mime = normalizeAudioMime(opts?.mimeType || blob.type);
  if (!isAllowedAudioMime(mime || blob.type)) {
    throw new Error("Formato de áudio não suportado neste aparelho.");
  }
  if (blob.size < MIN_AUDIO_BYTES) {
    throw new Error("Áudio vazio ou muito curto.");
  }
  if (blob.size > MAX_AUDIO_BYTES) {
    throw new Error("Áudio muito grande. Grave uma mensagem mais curta.");
  }

  const ext = extensionForAudioMime(mime || "audio/webm");
  const file = new File([blob], `voice${ext}`, {
    type: mime || blob.type || "audio/webm",
  });

  const form = new FormData();
  form.append("audio", file);
  if (opts?.recordedAt) {
    form.append("recordedAt", opts.recordedAt);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TRANSCRIBE_TIMEOUT_MS);

  try {
    const res = await fetch("/api/audio/transcribe", {
      method: "POST",
      body: form,
      signal: controller.signal,
    });

    const body = (await res.json().catch(() => ({}))) as {
      transcript?: string;
      locale?: string;
      error?: string;
    };

    if (!res.ok) {
      throw new Error(body.error ?? `Falha ao transcrever (${res.status})`);
    }

    const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
    if (!transcript) {
      throw new Error("Não consegui entender o áudio. Tenta de novo?");
    }

    return {
      transcript,
      locale: body.locale ?? "pt-BR",
    };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("A transcrição demorou demais. Tenta de novo?");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

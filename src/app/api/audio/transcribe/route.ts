import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkNyxRateLimit } from "@/lib/nyx/rateLimit";
import {
  isAllowedAudioMime,
  MAX_AUDIO_BYTES,
  MIN_AUDIO_BYTES,
  normalizeAudioMime,
} from "@/lib/audio/constants";
import { transcribeAudioBuffer } from "@/lib/audio/transcribeAudio";
import { hasOpenAIKey } from "@/lib/openai/client";

export const dynamic = "force-dynamic";
/** Uploads curtos; evita body parser default inadequado em alguns hosts. */
export const runtime = "nodejs";

const FIELD_NAME = "audio";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!hasOpenAIKey()) {
      return NextResponse.json(
        { error: "Transcrição indisponível no momento." },
        { status: 503 }
      );
    }

    const limit = checkNyxRateLimit(user.id);
    if (!limit.ok) {
      return NextResponse.json(
        {
          error: "Muitas requisições. Espera um instante.",
          retryAfterSec: limit.retryAfterSec,
        },
        { status: 429 }
      );
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Envie o áudio como multipart/form-data." },
        { status: 400 }
      );
    }

    const form = await request.formData();
    const entry = form.get(FIELD_NAME);
    if (!entry || !(entry instanceof File)) {
      return NextResponse.json(
        { error: "Campo audio é obrigatório." },
        { status: 400 }
      );
    }

    const declaredMime = normalizeAudioMime(entry.type);
    if (!isAllowedAudioMime(declaredMime || entry.type)) {
      return NextResponse.json(
        { error: "Formato de áudio não suportado." },
        { status: 415 }
      );
    }

    if (entry.size < MIN_AUDIO_BYTES) {
      return NextResponse.json(
        { error: "Áudio vazio ou muito curto." },
        { status: 400 }
      );
    }
    if (entry.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: "Áudio muito grande. Grave uma mensagem mais curta." },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await entry.arrayBuffer());
    // Não logar conteúdo do áudio / transcrição em produção.
    const { transcript } = await transcribeAudioBuffer({
      buffer,
      mimeType: declaredMime || "audio/webm",
      filename: entry.name || undefined,
    });

    return NextResponse.json({
      transcript,
      locale: "pt-BR",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Falha ao transcrever";
    // Evita vazar stack / prompt; mensagem curta ao cliente.
    console.error("POST /api/audio/transcribe", message);
    const isUserFacing =
      message.includes("entender") ||
      message.includes("indisponível") ||
      message.includes("OPENAI");
    return NextResponse.json(
      {
        error: isUserFacing
          ? message.replace("OPENAI_API_KEY não configurada", "Transcrição indisponível no momento.")
          : "Falha ao transcrever. Tenta de novo?",
      },
      { status: 500 }
    );
  }
}

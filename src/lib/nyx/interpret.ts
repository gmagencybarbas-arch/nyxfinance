import { getOpenAIClient, hasOpenAIKey, NYX_OPENAI_MODEL } from "@/lib/openai/client";
import { buildNyxSystemPrompt } from "./prompts";
import { NYX_INTERPRETATION_JSON_SCHEMA, nyxInterpretationSchema } from "./schemas";
import { normalizeInterpretation, validateActionCompleteness } from "./normalize";
import { interpretWithDeterministicParser } from "./deterministicFallback";
import type { NyxInterpretRequest, NyxInterpretation } from "./types";
import { buildInterpretUserPayload } from "@/lib/audio/audioInterpretBridge";

const MAX_MESSAGE_LENGTH = 2000;

/**
 * Interpretação única (texto ou transcrição de áudio).
 * Server-side only. `source` é só metadado — não entra no prompt da OpenAI.
 */
export async function interpretNyxMessage(
  input: NyxInterpretRequest
): Promise<NyxInterpretation> {
  const message = input.message?.trim() ?? "";
  if (!message) {
    return {
      intent: "NEEDS_CLARIFICATION",
      reply: "Manda um texto pra eu te ajudar.",
      requiresConfirmation: false,
      actions: [],
      pendingBatch: input.pendingBatch,
      missingFields: ["message"],
      source: "local",
    };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      intent: "NEEDS_CLARIFICATION",
      reply: "Mensagem grande demais. Resume um pouco?",
      requiresConfirmation: false,
      actions: [],
      pendingBatch: input.pendingBatch,
      missingFields: [],
      source: "local",
    };
  }

  if (!hasOpenAIKey()) {
    return interpretWithDeterministicParser(
      message,
      input.userCategories,
      input.pendingBatch
    );
  }

  try {
    const openai = getOpenAIClient();
    const system = buildNyxSystemPrompt({
      currentDate: input.currentDate,
      timezone: input.timezone,
      userCategories: input.userCategories,
      personalityKey: input.personalityKey ?? "nyx",
    });

    const userPayload = buildInterpretUserPayload({
      message,
      currentDate: input.currentDate,
      timezone: input.timezone,
      userCategories: input.userCategories,
      pendingBatch: input.pendingBatch,
      source: input.source,
      transcript: input.transcript,
      recordedAt: input.recordedAt,
      locale: input.locale,
    });

    const completion = await openai.chat.completions.create({
      model: NYX_OPENAI_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: JSON.stringify(userPayload),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: NYX_INTERPRETATION_JSON_SCHEMA,
      },
    });

    const rawText = completion.choices[0]?.message?.content;
    if (!rawText) throw new Error("Resposta vazia da OpenAI");

    const json = JSON.parse(rawText) as unknown;
    const parsed = nyxInterpretationSchema.parse(json);
    const normalized = normalizeInterpretation(parsed);

    const allMissing = normalized.actions.flatMap((a) => {
      const m = validateActionCompleteness(a);
      return m.map((f) => `${a.actionId}.${f}`);
    });

    return {
      ...normalized,
      missingFields: [...new Set([...normalized.missingFields, ...allMissing])],
      usedFallback: false,
      source: "openai",
    };
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("[nyx/interpret] OpenAI falhou, usando parser:", e);
    } else {
      console.error("[nyx/interpret] OpenAI falhou, usando parser");
    }
    return interpretWithDeterministicParser(
      message,
      input.userCategories,
      input.pendingBatch
    );
  }
}

export { MAX_MESSAGE_LENGTH };

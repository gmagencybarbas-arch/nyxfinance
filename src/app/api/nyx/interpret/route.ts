import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { interpretNyxMessage, MAX_MESSAGE_LENGTH } from "@/lib/nyx/interpret";
import { checkNyxRateLimit } from "@/lib/nyx/rateLimit";
import { nyxPendingBatchSchema } from "@/lib/nyx/schemas";
import type { NyxInterpretRequest } from "@/lib/nyx/types";
import { prisma } from "@/lib/prisma";
import { personalityKeyForCharacterId } from "@/lib/assistant/characterConfig";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const limit = checkNyxRateLimit(user.id);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Muitas mensagens. Espera um instante.", retryAfterSec: limit.retryAfterSec },
        { status: 429 }
      );
    }

    const body = (await request.json()) as Partial<NyxInterpretRequest>;
    const message = typeof body.message === "string" ? body.message : "";
    if (!message.trim()) {
      return NextResponse.json({ error: "message é obrigatório" }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: "message muito longa" }, { status: 400 });
    }

    let pendingBatch = null;
    if (body.pendingBatch != null) {
      const parsed = nyxPendingBatchSchema.safeParse(body.pendingBatch);
      if (!parsed.success) {
        return NextResponse.json({ error: "pendingBatch inválido" }, { status: 400 });
      }
      pendingBatch = parsed.data;
    }

    const preference = await prisma.userAssistantPreference
      .findUnique({
        where: { userId: user.id },
        select: { selectedCharacterId: true },
      })
      .catch(() => null);

    const personalityKey = preference?.selectedCharacterId
      ? personalityKeyForCharacterId(preference.selectedCharacterId)
      : "nyx";

    const input: NyxInterpretRequest = {
      message,
      currentDate:
        typeof body.currentDate === "string" && body.currentDate
          ? body.currentDate
          : new Date().toISOString(),
      timezone:
        typeof body.timezone === "string" && body.timezone
          ? body.timezone
          : "America/Sao_Paulo",
      userCategories: Array.isArray(body.userCategories)
        ? body.userCategories.filter((c): c is string => typeof c === "string")
        : [],
      pendingBatch,
      personalityKey,
    };

    const interpretation = await interpretNyxMessage(input);

    // Conta interação real respondida com sucesso (missão X de 5)
    const { incrementAssistantInteractions } = await import(
      "@/lib/journey/journey.service"
    );
    await incrementAssistantInteractions(user.id).catch(() => undefined);

    return NextResponse.json(interpretation);
  } catch (e) {
    console.error("POST /api/nyx/interpret", e);
    return NextResponse.json({ error: "Falha ao interpretar" }, { status: 500 });
  }
}

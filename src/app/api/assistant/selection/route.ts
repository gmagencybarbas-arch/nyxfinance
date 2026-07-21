import { NextResponse } from "next/server";
import { requireFinanceUser } from "@/lib/api/requireFinanceUser";
import {
  SelectAssistantError,
  selectAssistantPair,
} from "@/lib/assistant/assistant.service";
import { selectAssistantSchema } from "@/lib/assistant/schemas";

/** PATCH seleção de personagem + skin (validação server-side). */
export async function PATCH(request: Request) {
  const auth = await requireFinanceUser();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = selectAssistantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const preference = await selectAssistantPair(
      auth.ctx.userId,
      parsed.data.characterId,
      parsed.data.skinId
    );
    return NextResponse.json({ ok: true, preference });
  } catch (e) {
    if (e instanceof SelectAssistantError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("PATCH /api/assistant/selection", e);
    return NextResponse.json(
      { error: "Não foi possível salvar a seleção." },
      { status: 500 }
    );
  }
}

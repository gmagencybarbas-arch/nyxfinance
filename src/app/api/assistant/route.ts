import { NextResponse } from "next/server";
import { requireFinanceUser } from "@/lib/api/requireFinanceUser";
import { getAssistantState } from "@/lib/assistant/assistant.service";

/** GET catálogo + unlocks + preferência do usuário autenticado. */
export async function GET() {
  const auth = await requireFinanceUser();
  if (!auth.ok) return auth.response;

  try {
    const state = await getAssistantState(auth.ctx.userId);
    return NextResponse.json(state);
  } catch (e) {
    console.error("GET /api/assistant", e);
    return NextResponse.json(
      { error: "Não foi possível carregar a Loja." },
      { status: 500 }
    );
  }
}

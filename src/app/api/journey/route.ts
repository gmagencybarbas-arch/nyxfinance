import { NextResponse } from "next/server";
import { requireFinanceUser } from "@/lib/api/requireFinanceUser";
import { getJourneyState } from "@/lib/journey/journey.service";

/** GET estado real da Jornada (missões + recompensas + sync de grants). */
export async function GET() {
  const auth = await requireFinanceUser();
  if (!auth.ok) return auth.response;

  try {
    const state = await getJourneyState(auth.ctx.userId);
    return NextResponse.json(state);
  } catch (e) {
    console.error("GET /api/journey", e);
    return NextResponse.json(
      { error: "Não foi possível carregar a Jornada." },
      { status: 500 }
    );
  }
}
